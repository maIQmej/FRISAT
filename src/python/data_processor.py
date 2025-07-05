import numpy as np
import os
import sys

# Añadir la ruta del script al path de Python para encontrar los módulos locales
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

from model_loader import get_normalization_values

def normalize_data(signal):
    """
    Normaliza los datos usando los valores pre-cargados
    """
    mini, maxi = get_normalization_values()
    # Evitar división por cero si maxi y mini son iguales
    if maxi == mini:
        return np.zeros_like(signal)
    normalized = (signal - mini) / (maxi - mini)
    return normalized

def prepare_for_prediction(normalized_data):
    """
    Prepara los datos para la predicción, asegurando que tengan la longitud correcta (350).
    """
    # El modelo espera una forma específica, la adaptamos aquí
    if normalized_data.ndim == 1:
        data = np.reshape(normalized_data, (1, normalized_data.shape[0], 1))
    else:
        # No debería pasar, pero por si acaso
        data = normalized_data

    # El modelo espera una entrada de tamaño fijo 350
    current_length = data.shape[1]
    required_length = 350

    if current_length < required_length:
        # Si hay menos de 350 puntos, rellenar con ceros (padding)
        padding = np.zeros((1, required_length - current_length, 1))
        prepared = np.concatenate((data, padding), axis=1)
    else:
        # Si hay más de 350, tomar solo los primeros 350
        prepared = data[:, 0:required_length, :]
    
    return prepared
