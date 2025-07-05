import numpy as np
from model_loader import get_model
from data_processor import normalize_data, prepare_for_prediction
import firebase_admin
from firebase_admin import credentials, firestore

# Inicializar Firebase con tu credencial
cred = credentials.Certificate('tu-archivo-de-credenciales.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

def predict_flow_regime(signal_data):
    """
    Realiza la predicción del régimen de flujo
    
    Args:
        signal_data: Lista o array numpy con los datos del flujo
        
    Returns:
        dict: Resultado de la predicción
    """
    try:
        # Convertir a numpy array si es necesario
        if not isinstance(signal_data, np.ndarray):
            signal_data = np.array(signal_data)
            
        # Procesar los datos
        normalized = normalize_data(signal_data)
        prepared_data = prepare_for_prediction(normalized)
        
        # Obtener y usar el modelo
        model = get_model()
        prediction = np.argmax(model.predict(prepared_data))
        
        # Mapear la predicción a un régimen de flujo
        regimes = {0: "LAMINAR", 1: "TRANSITION", 2: "TURBULENT"}
        result = {
            'regime': regimes.get(prediction, "UNKNOWN"),
            'prediction': prediction,
            'timestamp': firestore.SERVER_TIMESTAMP
        }
        
        # Guardar el resultado en Firestore
        doc_ref = db.collection('predictions').add(result)
        
        return result
        
    except Exception as e:
        print(f"Error en la predicción: {str(e)}")
        return {'error': str(e)}

def get_last_prediction():
    """
    Obtiene la última predicción del Firestore
    """
    try:
        # Obtener la última predicción
        predictions = db.collection('predictions')
        query = predictions.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(1)
        docs = query.stream()
        
        for doc in docs:
            return doc.to_dict()
            
        return {'message': 'No hay predicciones disponibles'}
        
    except Exception as e:
        print(f"Error obteniendo la última predicción: {str(e)}")
        return {'error': str(e)}
