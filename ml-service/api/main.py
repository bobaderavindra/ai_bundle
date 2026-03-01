from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List

from inference.predict import predict_with_confidence
from models.model_store import load_lstm_model, load_model_info, load_transformer_model, save_models
from training.train_model import build_model_meta, train_lstm, train_transformer

app = FastAPI(title="InvestAI ML Service", version="1.0.0")


class TrainRequest(BaseModel):
    prices: List[float] = Field(min_length=2)


class InferRequest(BaseModel):
    nextIndex: int = Field(ge=1)


@app.get("/health")
def health():
    return {"status": "up"}


@app.post("/train")
@app.post("/ml/train")
def train(req: TrainRequest):
    try:
        lstm_model = train_lstm(req.prices)
        transformer_model = train_transformer(req.prices)
        meta = build_model_meta(req.prices)
        save_models(lstm_model, transformer_model, meta)
        return {
            "message": "models trained",
            "models": {
                "lstm": lstm_model,
                "transformer": transformer_model,
            },
            "modelInfo": load_model_info(),
        }
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex)) from ex


@app.post("/predict")
@app.post("/ml/predict")
@app.post("/ml/infer")
def predict(req: InferRequest):
    lstm_model = load_lstm_model()
    transformer_model = load_transformer_model()
    result = predict_with_confidence(lstm_model, transformer_model, req.nextIndex)
    return {
        "prediction": result["prediction"],
        "confidence": result["confidence"],
        "models": {
            "lstm": {"prediction": result["lstmPrediction"]},
            "transformer": {"prediction": result["transformerPrediction"]},
        },
    }


@app.get("/model-info")
@app.get("/ml/model-info")
def model_info():
    return load_model_info()
