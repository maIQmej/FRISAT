#!/usr/bin/env python3
"""
Script para limpiar mediciones en estado 'writing'.
"""

import sqlite3
from pathlib import Path

def clean_database():
    """Limpia mediciones en estado 'writing'."""
    
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
        
        # Contar mediciones en estado writing
        cursor.execute("SELECT COUNT(*) FROM measurements WHERE status = 'writing'")
        writing_count = cursor.fetchone()[0]
        
        if writing_count > 0:
            # Eliminar mediciones en estado writing
            cursor.execute("DELETE FROM measurements WHERE status = 'writing'")
            conn.commit()
            print(f"[OK] Eliminadas {writing_count} mediciones en estado 'writing'")
        else:
            print("[INFO] No hay mediciones en estado 'writing' para eliminar")
        
        # Mostrar estado actual
        cursor.execute("SELECT status, COUNT(*) FROM measurements GROUP BY status")
        stats = cursor.fetchall()
        if stats:
            print("\n[INFO] Estado actual de la base de datos:")
            for status, count in stats:
                print(f"  {status}: {count}")
        
        conn.close()
        
    except Exception as e:
        print(f"[ERROR] Error limpiando base de datos: {e}")

if __name__ == "__main__":
    clean_database()

