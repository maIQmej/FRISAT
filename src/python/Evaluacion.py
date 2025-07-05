#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
@author: CARLOS AVILES CRUZ, 03-septiembre-2024
Adaptado para integración con Node.js
"""
import sys
import json
import os
import numpy as np

# Suprimir logs de TensorFlow para una salida más limpia
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 
from keras.models import load_model

def get_script_path():
    """Obtiene la ruta absoluta del directorio donde se encuentra el script."""
    return os.path.dirname(os.path.realpath(sys.argv[0]))

def Normaliza(dato, mini, maxi):
    """Normaliza los datos a un rango de 0 a 1."""
    if (maxi - mini) == 0:
        return dato # Evitar división por cero
    return (dato - mini) / (maxi - mini)

def main():
    try:
        # Obtener la ruta base del script para localizar los archivos del modelo
        base_path = get_script_path()
        
        # Definir rutas a los archivos del modelo y de normalización
        model_path = os.path.join(base_path, 'Modelo_1500.h5')
        maximin_path = os.path.join(base_path, 'MaxiMini.npz')

        # Cargar el modelo y los datos de normalización
        model = load_model(model_path, compile=False)
        MaxiMini = np.load(maximin_path)
        mini = MaxiMini['mini']
        maxi = MaxiMini['maxi']

        # Leer los datos de los sensores desde la entrada estándar (stdin)
        input_data = sys.stdin.read()
        sensor_data_points = json.loads(input_data)
        
        if not sensor_data_points:
            print("indeterminado", file=sys.stdout, flush=True)
            return

        # Extraer datos del primer sensor disponible en el array de datos
        first_sensor_key = None
        for key in sensor_data_points[0].keys():
            if key.startswith('sensor'):
                first_sensor_key = key
                break
        
        if not first_sensor_key:
            print("indeterminado", file=sys.stdout, flush=True)
            return

        # Crear un array de numpy con los valores del sensor
        dato = np.array([p.get(first_sensor_key, 0.0) for p in sensor_data_points])

        # Normalizar y preparar los datos
        DB = Normaliza(dato, mini, maxi)
        
        # Asegurar que los datos tengan la longitud esperada por el modelo (350 muestras)
        required_samples = 350
        if len(DB) > required_samples:
            # Truncar si hay más datos de los necesarios
            DB = DB[:required_samples]
        elif len(DB) < required_samples:
            # Rellenar con ceros si faltan datos
            padding = np.zeros(required_samples - len(DB))
            DB = np.concatenate([DB, padding])
        
        # Remodelar para que coincida con la entrada del modelo
        DB = np.reshape(DB, (1, required_samples, 1))

        # Realizar la predicción
        prediction = model.predict(DB, verbose=0)
        result = np.argmax(prediction)

        # Imprimir el resultado para que el script de Node.js lo capture
        if result == 0:
            print("flujo laminar", file=sys.stdout, flush=True)
        elif result == 2:
            print("turbulento", file=sys.stdout, flush=True)
        else:  # Esto cubre el resultado 1 (Transición) y cualquier otro caso
            print("indeterminado", file=sys.stdout, flush=True)

    except Exception as e:
        # Enviar errores a stderr para depuración en Node.js
        print(f"Error in Python script: {e}", file=sys.stderr, flush=True)
        # Asegurarse de que siempre haya una salida válida para no romper la app
        print("indeterminado", file=sys.stdout, flush=True)

if __name__ == "__main__":
    main()
