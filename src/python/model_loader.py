import numpy as np
from keras.models import load_model
import os
import sys

# Ruta base del directorio de scripts de python
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Rutas a los archivos del modelo
MODEL_PATH = os.path.join(BASE_DIR, 'Modelo_1500.h5')
MAX_MIN_PATH = os.path.join(BASE_DIR, 'MaxiMini.npz')

# Variable global para el modelo y los valores de normalización
model = None
mini = None
maxi = None

def load_dependencies():
    """Carga el modelo y los valores de normalización si aún no se han cargado."""
    global model, mini, maxi
    if model is None:
        try:
            model = load_model(MODEL_PATH)
            MaxiMini = np.load(MAX_MIN_PATH)
            mini = MaxiMini['mini']
            maxi = MaxiMini['maxi']
        except FileNotFoundError as e:
            print(f"Error loading model files: {e}. Ensure 'Modelo_1500.h5' and 'MaxiMini.npz' are in the same directory.", file=sys.stderr)
            # Salir si los archivos del modelo no se encuentran
            sys.exit(1)
        except Exception as e:
            print(f"An unexpected error occurred while loading model dependencies: {e}", file=sys.stderr)
            sys.exit(1)

def get_model():
    """Devuelve el modelo Keras cargado."""
    load_dependencies()
    return model

def get_normalization_values():
    """Devuelve los valores de normalización (min, max)."""
    load_dependencies()
    return mini, maxi
