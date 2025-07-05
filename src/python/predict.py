import sys
import json
import random

# Este es un script de marcador de posición.
# Reemplázalo con la lógica de tu modelo de predicción.
#
# El script debe:
# 1. Leer los datos del sensor desde la entrada estándar (stdin).
#    Los datos vendrán como un string JSON.
# 2. Analizar los datos y hacer una predicción.
# 3. Imprimir el resultado (ej. 'flujo laminar' o 'turbulento') en la salida estándar (stdout).

def predict_regime(sensor_data):
    # --- INICIO DE LA LÓGICA DE TU MODELO ---
    #
    # Ejemplo: aquí puedes poner la lógica de tu modelo de scikit-learn,
    # TensorFlow, PyTorch, etc.
    #
    # Por ahora, solo devolverá una predicción aleatoria.
    #
    # La variable `sensor_data` es un array de objetos, cada uno representando un punto en el tiempo:
    # [{"time": 0.0, "sensor1": 2.5, "sensor2": 3.1}, {"time": 0.1, "sensor1": 2.6, ...}]

    if not sensor_data:
        return "indeterminado"

    # Simulación simple: si el promedio del último valor del sensor1 es > 2.5, es turbulento
    # Reemplaza esto con tu lógica real.
    try:
        last_point = sensor_data[-1]
        sensor1_value = last_point.get("sensor1", 0)

        if sensor1_value > 3.5:
            return "turbulento"
        else:
            return "flujo laminar"
    except (IndexError, KeyError):
        return "indeterminado"
    # --- FIN DE LA LÓGICA DE TU MODELO ---

if __name__ == "__main__":
    try:
        # 1. Leer el string JSON de stdin
        input_data_str = sys.stdin.read()

        # 2. Parsear el JSON a un objeto Python
        if input_data_str:
            sensor_data_points = json.loads(input_data_str)
        else:
            sensor_data_points = []

        # 3. Realizar la predicción
        prediction = predict_regime(sensor_data_points)

        # 4. Imprimir el resultado a stdout
        print(prediction)

    except Exception as e:
        # Si hay un error, imprímelo a stderr para depuración
        # y devuelve 'indeterminado' a stdout.
        print(f"Error in python script: {e}", file=sys.stderr)
        print("indeterminado")
