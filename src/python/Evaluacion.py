#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
@author: CARLOS AVILES CRUZ, adaptado para FRISAT
"""
import json
import sys
import numpy as np
import os

# Suprimir logs de TensorFlow
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Añadir la ruta del script al path de Python para encontrar los módulos locales
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

# Importar los módulos del proyecto
try:
    from data_processor import normalize_data, prepare_for_prediction
    from model_loader import get_model
except ImportError as e:
    print(f"Error importing local modules: {e}. Make sure data_processor.py and model_loader.py are in the same directory.", file=sys.stderr, flush=True)
    sys.exit(1)


def main():
    try:
        # 1. Leer datos de sensores desde stdin (enviados por Node.js)
        input_data_str = sys.stdin.read()
        if not input_data_str:
            print("indeterminado", file=sys.stdout, flush=True)
            return
            
        all_sensor_data = json.loads(input_data_str)

        # Asumimos que los datos relevantes están en la primera clave de sensor encontrada (ej. 'sensor1')
        first_sensor_key = None
        if all_sensor_data:
            for key in all_sensor_data[0]:
                if key.startswith('sensor'):
                    first_sensor_key = key
                    break
        
        if not first_sensor_key:
            print("indeterminado", file=sys.stdout, flush=True)
            return

        signal_data = np.array([p.get(first_sensor_key, 0) for p in all_sensor_data])

        # 2. Procesar los datos usando los nuevos módulos
        normalized_signal = normalize_data(signal_data)
        prepared_data = prepare_for_prediction(normalized_signal)
        
        # 3. Obtener el modelo y predecir
        model = get_model()
        prediction = np.argmax(model.predict(prepared_data, verbose=0))

        # 4. Devolver el resultado
        if prediction == 0:
            print("flujo laminar", file=sys.stdout, flush=True)
        elif prediction == 1:
            # El modelo clasifica "Transición" como 1, lo mapeamos a "indeterminado"
            # para que coincida con los estados de la app.
            print("indeterminado", file=sys.stdout, flush=True)
        elif prediction == 2:
            print("turbulento", file=sys.stdout, flush=True)
        else:
            print("indeterminado", file=sys.stdout, flush=True)

    except json.JSONDecodeError:
        print(f"Error: Invalid JSON received.", file=sys.stderr, flush=True)
        print("indeterminado", file=sys.stdout, flush=True)
    except Exception as e:
        print(f"An unexpected error occurred in Evaluacion.py: {e}", file=sys.stderr, flush=True)
        print("indeterminado", file=sys.stdout, flush=True)

if __name__ == "__main__":
    main()
