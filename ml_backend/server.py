from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import numpy as np
from keras.models import load_model
import json
from typing import Dict, Any, List
from database import create_run, finalize_run, list_runs, get_run_file, get_run_metadata, delete_run, get_database_stats

WINDOW = 350
MAX_SENSORS = 5

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # URLs del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_path = os.path.join(os.path.dirname(__file__), "Modelo_1500.h5")
model = load_model(model_path, compile=False)

mm_path = os.path.join(os.path.dirname(__file__), "MaxiMini.npz")
mm = np.load(mm_path)
MINI, MAXI = float(mm["mini"]), float(mm["maxi"])

LABELS = ["LAMINAR", "TRANSITION", "TURBULENT"]

def clip_norm(x):
    x = np.clip(x, MINI, MAXI)
    return (x - MINI) / (MAXI - MINI)

@app.websocket("/ws")
async def ws_predict(ws: WebSocket):
    await ws.accept()
    n_sensors = 1
    hop = 30
    buffers = [np.zeros(WINDOW, dtype=np.float32) for _ in range(MAX_SENSORS)]
    idxs = [0] * MAX_SENSORS
    filled = [0] * MAX_SENSORS
    hop_count = 0
    sensors_active = list(range(n_sensors))

    try:
        while True:
            msg = await ws.receive_json()
            print("Mensaje recibido:", msg)  # <-- Agrega este print
            t = msg.get("type")
            if t == "CONFIG":
                n_sensors = int(msg.get("n_sensors", 1))
                n_sensors = max(1, min(n_sensors, MAX_SENSORS))
                hop = int(msg.get("hop", hop))
                sensors_active = list(range(n_sensors))
                buffers = [np.zeros(WINDOW, dtype=np.float32) for _ in range(n_sensors)]
                idxs = [0] * n_sensors
                filled = [0] * n_sensors
                hop_count = 0
                await ws.send_json({"type": "ACK", "hop": hop, "n_sensors": n_sensors})
                continue

            if t == "SAMPLES":
                values = msg.get("values", [])
                print("Valores recibidos:", values)  # <-- Agrega este print
                # values: [s1, s2, ...] por muestra
                if len(values) != n_sensors:
                    await ws.send_json({"type": "ERROR", "msg": "Número de sensores no coincide"})
                    continue
                arr = clip_norm(np.array(values, dtype=np.float32))
                for i, v in enumerate(arr):
                    buffers[i][idxs[i]] = v
                    idxs[i] = (idxs[i] + 1) % WINDOW
                    if filled[i] < WINDOW:
                        filled[i] += 1

                if all(f == WINDOW for f in filled):
                    hop_count += 1
                    if hop_count >= hop:
                        hop_count = 0
                        # Reconstruir ventana por sensor
                        window_data = []
                        for i in range(n_sensors):
                            start = idxs[i]
                            win = np.concatenate([buffers[i][start:], buffers[i][:start]])
                            window_data.append(win)
                        # Transponer para [WINDOW, n_sensors]
                        win_matrix = np.stack(window_data, axis=-1)
                        win_matrix = win_matrix.reshape(1, WINDOW, n_sensors)
                        probs = model.predict(win_matrix, verbose=0)[0]
                        k = int(np.argmax(probs))
                        label = LABELS[k]
                        print("Predicción enviada:", label, probs)
                        await ws.send_json({
                            "type": "PREDICTION",
                            "label": label,
                            "probs": probs.tolist(),
                            "window": WINDOW
                        })
                else:
                    await ws.send_json({
                        "type": "FILLING",
                        "have": min(filled),
                        "need": WINDOW - min(filled)
                    })

    except WebSocketDisconnect:
        return

# Endpoints para gestión de mediciones
@app.post("/runs/start")
async def start_measurement_run(metadata: Dict[str, Any]):
    """Inicia una nueva medición y retorna el ID del run."""
    try:
        run_id = create_run(metadata)
        return {"run_id": run_id, "status": "created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating run: {str(e)}")

@app.post("/runs/{run_id}/finalize")
async def finalize_measurement_run(run_id: str, data: Dict[str, Any]):
    """Finaliza una medición guardando los datos en la base de datos."""
    try:
        # Extraer datos del request
        rows_data = data.get("rows", [])
        header = data.get("header", [])
        meta = data.get("meta", {})
        
        # Convertir rows_data a iterador
        def rows_iterator():
            for row in rows_data:
                yield row
        
        success = finalize_run(run_id, rows_iterator(), header, meta)
        
        if success:
            return {"status": "success", "message": "Measurement finalized successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to finalize measurement")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finalizing run: {str(e)}")

@app.get("/historial")
async def get_measurement_history(limit: int = 50, offset: int = 0):
    """Obtiene el historial de mediciones desde la base de datos."""
    try:
        runs = list_runs(limit, offset)
        return {"runs": runs, "total": len(runs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting history: {str(e)}")

@app.get("/runs/{run_id}")
async def get_measurement_details(run_id: str):
    """Obtiene los detalles de una medición específica."""
    try:
        metadata = get_run_metadata(run_id)
        if not metadata:
            raise HTTPException(status_code=404, detail="Measurement not found")
        return metadata
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting measurement details: {str(e)}")

@app.get("/runs/{run_id}/download")
async def download_measurement_file(run_id: str):
    """Descarga el archivo comprimido de una medición."""
    try:
        file_data = get_run_file(run_id)
        if not file_data:
            raise HTTPException(status_code=404, detail="Measurement file not found")
        
        # Obtener metadatos para el nombre del archivo
        metadata = get_run_metadata(run_id)
        if not metadata:
            raise HTTPException(status_code=404, detail="Measurement not found")
        
        # Generar nombre de archivo
        created_at = metadata["created_at"][:10]  # YYYY-MM-DD
        filename = f"medicion_{run_id[:8]}_{created_at}.csv.gz"
        
        return StreamingResponse(
            iter([file_data]),
            media_type="application/gzip",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading file: {str(e)}")

@app.delete("/runs/{run_id}")
async def delete_measurement(run_id: str):
    """Elimina una medición de la base de datos."""
    try:
        success = delete_run(run_id)
        if success:
            return {"status": "success", "message": "Measurement deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Measurement not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting measurement: {str(e)}")

@app.get("/stats")
async def get_database_statistics():
    """Obtiene estadísticas de la base de datos."""
    try:
        stats = get_database_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting statistics: {str(e)}")

