from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from keras.models import load_model
import numpy as np

WINDOW = 350
MAX_SENSORS = 5

app = FastAPI()

model = load_model("Modelo_1500.h5", compile=False)
mm = np.load("MaxiMini.npz")
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
                        await ws.send_json({
                            "type": "PREDICTION",
                            "label": LABELS[k],
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