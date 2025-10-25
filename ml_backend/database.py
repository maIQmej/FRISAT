"""
Funciones de base de datos para FRISAT.
Maneja operaciones CRUD para mediciones en SQLite.
"""

import sqlite3
import json
import gzip
import hashlib
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Iterator, Tuple
import csv
from io import StringIO

# Configuración de la base de datos
import platform
if platform.system() == "Windows":
    DATA_DIR = Path("frisat-data")
else:
    DATA_DIR = Path("/home/pi/frisat-data")
DB_PATH = DATA_DIR / "frisat.db"

def get_connection() -> sqlite3.Connection:
    """Obtiene una conexión a la base de datos con configuración optimizada."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA temp_store=MEMORY")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def create_run(meta: Dict[str, Any]) -> str:
    """
    Crea un nuevo registro de medición en estado 'writing'.
    
    Args:
        meta: Diccionario con metadatos de la medición
        
    Returns:
        str: ID único de la medición creada
    """
    run_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    
    # Extraer sensores activos
    sensors = [f"sensor{i+1}" for i in range(5) if meta.get(f"sensor{i+1}", False)]
    
    conn = get_connection()
    try:
        with conn:
            conn.execute("""
                INSERT INTO measurements (
                    id, created_at, sampling_hz, duration_sec, sensors,
                    model_version, normalization_version, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                run_id,
                created_at,
                meta.get('sampling_hz', 1),
                meta.get('duration_sec', 10),
                json.dumps(sensors),
                meta.get('model_version', '1.0'),
                meta.get('normalization_version', '1.0'),
                'writing'
            ))
        
        return run_id
    finally:
        conn.close()

def finalize_run(run_id: str, rows_iterable: Iterator[Dict[str, Any]], 
                header: List[str], meta: Dict[str, Any]) -> bool:
    """
    Finaliza una medición guardando los datos comprimidos en la base de datos.
    
    Args:
        run_id: ID de la medición
        rows_iterable: Iterador de filas de datos
        header: Lista de encabezados CSV
        meta: Metadatos adicionales
        
    Returns:
        bool: True si se guardó exitosamente, False en caso contrario
    """
    conn = get_connection()
    try:
        with conn:
            # Verificar que el run existe y está en estado 'writing'
            cursor = conn.execute(
                "SELECT status FROM measurements WHERE id = ?", (run_id,)
            )
            result = cursor.fetchone()
            if not result or result[0] != 'writing':
                return False
            
            # Generar CSV en memoria
            csv_buffer = StringIO()
            writer = csv.writer(csv_buffer)
            
            # Escribir metadatos como comentarios
            writer.writerow(['#FRISAT_MEASUREMENT'])
            writer.writerow(['#startTime', meta.get('start_time', datetime.now().isoformat())])
            writer.writerow(['#durationLabel', f"{meta.get('duration_sec', 0)}s"])
            writer.writerow(['#samplesPerSecondLabel', f"{meta.get('sampling_hz', 1)} samples/s"])
            writer.writerow(['#totalSamples', meta.get('total_samples', 0)])
            writer.writerow(['#RAW_HEADERS'] + header)
            writer.writerow(['#dominantRegimen', meta.get('dominant_regimen', 'indeterminado')])
            writer.writerow(['#collectedData'])
            
            # Escribir datos
            row_count = 0
            for row_data in rows_iterable:
                row = [row_count]  # Número de muestra
                for col in header:
                    row.append(row_data.get(col, 0))
                writer.writerow(row)
                row_count += 1
            
            # Obtener contenido CSV
            csv_content = csv_buffer.getvalue()
            csv_buffer.close()
            
            # Comprimir con gzip
            compressed_data = gzip.compress(csv_content.encode('utf-8'))
            
            # Calcular SHA256
            sha256_hash = hashlib.sha256(compressed_data).hexdigest()
            
            # Generar preview JSON
            current_time = datetime.now().isoformat()
            preview_data = {
                'classes': meta.get('classes', ['LAMINAR', 'TRANSITION', 'TURBULENT']),
                'min_timestamp': meta.get('min_timestamp', current_time),
                'max_timestamp': meta.get('max_timestamp', current_time),
                'sensor_count': len([s for s in meta.get('sensors', {}).values() if s]),
                'dominant_regimen': meta.get('dominant_regimen', 'indeterminado'),
                'file_name': meta.get('file_name', ''),
            }
            
            # Actualizar registro
            conn.execute("""
                UPDATE measurements SET
                    data_gz = ?, sha256 = ?, rows = ?, preview_json = ?, status = 'ready'
                WHERE id = ?
            """, (
                compressed_data,
                sha256_hash,
                row_count,
                json.dumps(preview_data),
                run_id
            ))
            
            return True
            
    except Exception as e:
        print(f"Error finalizando medición {run_id}: {e}")
        # Marcar como fallida
        try:
            conn.execute(
                "UPDATE measurements SET status = 'failed' WHERE id = ?", (run_id,)
            )
        except:
            pass
        return False
    finally:
        conn.close()

def list_runs(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    """
    Lista las mediciones guardadas.
    
    Args:
        limit: Número máximo de resultados
        offset: Desplazamiento para paginación
        
    Returns:
        Lista de diccionarios con información de las mediciones
    """
    conn = get_connection()
    try:
        cursor = conn.execute("""
            SELECT id, created_at, sampling_hz, duration_sec, sensors,
                   model_version, normalization_version, rows, status, preview_json
            FROM measurements
            WHERE status = 'ready'
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """, (limit, offset))
        
        results = []
        for row in cursor.fetchall():
            preview = json.loads(row[9]) if row[9] else {}
            results.append({
                'id': row[0],
                'created_at': row[1],
                'sampling_hz': row[2],
                'duration_sec': row[3],
                'sensors': json.loads(row[4]),
                'model_version': row[5],
                'normalization_version': row[6],
                'rows': row[7],
                'status': row[8],
                'preview': preview,
                'file_name': preview.get('file_name', ''),
            })
        
        return results
    finally:
        conn.close()

def get_run_file(run_id: str) -> Optional[bytes]:
    """
    Obtiene el archivo comprimido de una medición.
    
    Args:
        run_id: ID de la medición
        
    Returns:
        Bytes del archivo .csv.gz o None si no existe
    """
    conn = get_connection()
    try:
        cursor = conn.execute(
            "SELECT data_gz FROM measurements WHERE id = ? AND status = 'ready'", 
            (run_id,)
        )
        result = cursor.fetchone()
        return result[0] if result else None
    finally:
        conn.close()

def get_run_metadata(run_id: str) -> Optional[Dict[str, Any]]:
    """
    Obtiene los metadatos de una medición.
    
    Args:
        run_id: ID de la medición
        
    Returns:
        Diccionario con metadatos o None si no existe
    """
    conn = get_connection()
    try:
        cursor = conn.execute("""
            SELECT id, created_at, sampling_hz, duration_sec, sensors,
                   model_version, normalization_version, rows, status, preview_json
            FROM measurements WHERE id = ?
        """, (run_id,))
        
        result = cursor.fetchone()
        if not result:
            return None
        
        preview = json.loads(result[9]) if result[9] else {}
        return {
            'id': result[0],
            'created_at': result[1],
            'sampling_hz': result[2],
            'duration_sec': result[3],
            'sensors': json.loads(result[4]),
            'model_version': result[5],
            'normalization_version': result[6],
            'rows': result[7],
            'status': result[8],
            'preview': preview,
            'file_name': preview.get('file_name', ''),
        }
    finally:
        conn.close()

def delete_run(run_id: str) -> bool:
    """
    Elimina una medición de la base de datos.
    
    Args:
        run_id: ID de la medición
        
    Returns:
        True si se eliminó exitosamente, False en caso contrario
    """
    conn = get_connection()
    try:
        with conn:
            cursor = conn.execute("DELETE FROM measurements WHERE id = ?", (run_id,))
            return cursor.rowcount > 0
    finally:
        conn.close()

def get_database_stats() -> Dict[str, Any]:
    """
    Obtiene estadísticas de la base de datos.
    
    Returns:
        Diccionario con estadísticas
    """
    conn = get_connection()
    try:
        cursor = conn.execute("""
            SELECT 
                COUNT(*) as total_runs,
                COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready_runs,
                COUNT(CASE WHEN status = 'writing' THEN 1 END) as writing_runs,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_runs,
                SUM(rows) as total_rows,
                SUM(LENGTH(data_gz)) as total_size_bytes
            FROM measurements
        """)
        
        result = cursor.fetchone()
        return {
            'total_runs': result[0],
            'ready_runs': result[1],
            'writing_runs': result[2],
            'failed_runs': result[3],
            'total_rows': result[4] or 0,
            'total_size_bytes': result[5] or 0
        }
    finally:
        conn.close()
