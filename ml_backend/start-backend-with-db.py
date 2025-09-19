#!/usr/bin/env python3
"""
Script de inicio del backend con inicialización automática de la base de datos.
"""

import subprocess
import sys
import os
from pathlib import Path

def main():
    """Inicia el backend con inicialización automática de la base de datos."""
    
    # Cambiar al directorio del backend
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Inicializar la base de datos
    print("Inicializando base de datos...")
    try:
        from init_db import init_database
        init_database()
        print("[OK] Base de datos inicializada correctamente")
    except Exception as e:
        print(f"[ERROR] Error inicializando base de datos: {e}")
        sys.exit(1)
    
    # Instalar dependencias si es necesario
    print("Verificando dependencias...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True, capture_output=True)
        print("[OK] Dependencias verificadas")
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Error instalando dependencias: {e}")
        sys.exit(1)
    
    # Iniciar el servidor
    print("Iniciando servidor FastAPI...")
    try:
        subprocess.run([sys.executable, "-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", "8765", "--reload"], 
                      check=True)
    except KeyboardInterrupt:
        print("\nServidor detenido por el usuario")
    except Exception as e:
        print(f"[ERROR] Error iniciando servidor: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
