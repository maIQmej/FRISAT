#!/usr/bin/env python3
"""
Script para verificar el estado de la base de datos.
"""

import sqlite3
from pathlib import Path

def check_database():
    """Verifica el estado de la base de datos."""
    
    # Configurar ruta de la base de datos
    import platform
    if platform.system() == "Windows":
        db_path = Path("frisat-data/frisat.db")
    else:
        db_path = Path("/home/pi/frisat-data/frisat.db")
    
    if not db_path.exists():
        print(f"[ERROR] Base de datos no encontrada en: {db_path}")
        return
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Contar mediciones
        cursor.execute("SELECT COUNT(*) FROM measurements")
        total = cursor.fetchone()[0]
        print(f"[INFO] Total de mediciones en la base de datos: {total}")
        
        # Mostrar últimas 5 mediciones
        cursor.execute("""
            SELECT id, status, created_at, rows, sampling_hz, duration_sec 
            FROM measurements 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        
        measurements = cursor.fetchall()
        if measurements:
            print("\n[INFO] Últimas 5 mediciones:")
            for row in measurements:
                print(f"  ID: {row[0][:8]}... | Estado: {row[1]} | Fecha: {row[2]} | Filas: {row[3]} | Hz: {row[4]} | Duración: {row[5]}s")
        else:
            print("[INFO] No hay mediciones en la base de datos")
        
        # Mostrar estadísticas por estado
        cursor.execute("""
            SELECT status, COUNT(*) 
            FROM measurements 
            GROUP BY status
        """)
        
        stats = cursor.fetchall()
        if stats:
            print("\n[INFO] Estadísticas por estado:")
            for status, count in stats:
                print(f"  {status}: {count}")
        
        conn.close()
        
    except Exception as e:
        print(f"[ERROR] Error verificando base de datos: {e}")

if __name__ == "__main__":
    check_database()
