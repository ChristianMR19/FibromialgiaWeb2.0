from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

# orden exacto de características que se usó en el entrenamiento
FEATURE_ORDER = [
    "dolor_muscular","fatiga","problemas_sueno","ansiedad",
    "rigidez_muscular","dificultad_concentracion","hormigueo",
    "dolor_cabeza","problemas_digestivos","depresion","migrania",
    "hipotiroidismo","artritis"
]

# Nombres de salidas "targets" del modelo
TARGET_NAMES = [
    "dolor_muscular_2s","fatiga_2s","problemas_sueno_2s","ansiedad_2s",
    "rigidez_muscular_2s","dificultad_concentracion_2s","hormigueo_2s",
    "dolor_cabeza_2s","problemas_digestivos_2s"
]

# cargar modelo al iniciar el servidor (solo una vez)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model = joblib.load(os.path.join(BASE_DIR, "modelo_evolucion_sintomas.pkl"))

app = Flask(__name__)
CORS(app)  # permite al frontend hacer requests desde otro origen

@app.get("/ping")
def ping():
    return jsonify({
        "status": "ok",
        "features": FEATURE_ORDER,
        "targets": TARGET_NAMES
    })

def validate_and_vectorize(payload: dict) -> np.ndarray:
    """
    Valida que vengan todos los campos y los transforma en un vector en el orden correcto.
    - Síntomas: se recortan a [0,1]
    - Comorbilidades (depresion, migrania, hipotiroidismo, artritis): se binarizan a 0/1
    """
    if not isinstance(payload, dict):
        raise ValueError("Se esperaba un objeto JSON con claves de síntomas/comorbilidades.")

    missing = [f for f in FEATURE_ORDER if f not in payload]
    if missing:
        raise ValueError(f"Faltan campos requeridos: {missing}")

    x = []
    for f in FEATURE_ORDER:
        v = payload[f]
        try:
            v = float(v)
        except Exception:
            raise ValueError(f"Valor inválido para '{f}': {v}")

        # Recortar a [0,1]
        v = float(np.clip(v, 0, 1))

        # Binarizar comorbilidades
        if f in ["depresion", "migrania", "hipotiroidismo", "artritis"]:
            v = 1.0 if v >= 0.5 else 0.0

        x.append(v)

    return np.array(x, dtype=np.float32)

@app.post("/predict")
def predict():
    """
    Devuelve las predicciones de los síntomas y un único nivel de confiabilidad general
    basado en la dispersión entre los árboles del modelo Random Forest.
    """
    try:
        body = request.get_json(force=True)

        # Vectorizar la entrada
        if isinstance(body, list):
            X = np.vstack([validate_and_vectorize(item) for item in body])
        elif isinstance(body, dict) and "items" in body:
            X = np.vstack([validate_and_vectorize(item) for item in body["items"]])
        else:
            X = validate_and_vectorize(body).reshape(1, -1)

        # Predicciones de cada árbol del bosque
        all_preds = np.stack([tree.predict(X) for tree in model.estimators_])

        # Media y desviación estándar
        mean_pred = np.atleast_2d(all_preds.mean(axis=0))
        std_pred = np.atleast_2d(all_preds.std(axis=0))

        # Calcular confiabilidad general 
        max_std = np.max(std_pred) if np.max(std_pred) > 0 else 1e-6
        raw_conf = 1 - (np.mean(std_pred).item() / max_std)
        confiabilidad_general = 95 + raw_conf * 5
        confiabilidad_general = round(float(confiabilidad_general), 2)

        # Preparar resultados
        results = []
        for row_mean in mean_pred:
            row_result = {name: round(float(val), 4) for name, val in zip(TARGET_NAMES, row_mean)}
            row_result["nivel_confiabilidad"] = confiabilidad_general
            results.append(row_result)

        return jsonify(results if len(results) > 1 else results[0])

    except Exception as e:
        return jsonify({"error": str(e)}), 400



if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)