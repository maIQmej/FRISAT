#!/usr/bin/env python3
"""
Script de inicialización de la base de datos SQLite para FRISAT.
Crea la tabla measurements con todos los campos requeridos.
"""

import sqlite3
import os
from pathlib import Path

def init_database():
    """Inicializa la base de datos SQLite con la tabla measurements."""
    
    # Crear directorio de datos si no existe
    # En Windows, usar el directorio actual; en Linux, usar /home/pi/frisat-data
    import platform
    if platform.system() == "Windows":
        data_dir = Path("frisat-data")
    else:
        data_dir = Path("/home/pi/frisat-data")
    
    data_dir.mkdir(parents=True, exist_ok=True)
    
    db_path = data_dir / "frisat.db"
    
    # Conectar a la base de datos
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # Configurar PRAGMAs para optimización
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA temp_store=MEMORY")
    cursor.execute("PRAGMA foreign_keys=ON")
    
    # Crear tabla measurements
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS measurements (
            id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            sampling_hz INTEGER NOT NULL,
            duration_sec INTEGER NOT NULL,
            sensors TEXT NOT NULL,
            model_version TEXT NOT NULL,
            normalization_version TEXT NOT NULL,
            rows INTEGER DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'writing',
            preview_json TEXT,
            data_gz BLOB,
            sha256 TEXT,
            UNIQUE(id)
        )
    """)
    
    # Crear índices para optimizar consultas
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_measurements_created_at ON measurements(created_at)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_measurements_status ON measurements(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_measurements_sha256 ON measurements(sha256)")
    
    # Confirmar cambios
    conn.commit()
    conn.close()
    
    print(f"Base de datos inicializada en: {db_path}")
    print("Tabla 'measurements' creada exitosamente")
    print("Índices creados para optimización de consultas")

if __name__ == "__main__":
    init_database()
