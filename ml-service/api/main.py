from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List

from inference.predict import predict_next
from models.model_store import load_model, save_model
from training.train_model import train_linear

app = FastAPI(title="InvestAI ML Service", version="1.0.0")


class TrainRequest(BaseModel):
    prices: List[float] = Field(min_length=2)


class InferRequest(BaseModel):
    nextIndex: int = Field(ge=1)


@app.get("/health")
def health():
    return {"status": "up"}


@app.post("/ml/train")
def train(req: TrainRequest):
    try:
        model = train_linear(req.prices)
        save_model(model)
        return {"message": "model trained", "model": model}
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex)) from ex


@app.post("/ml/infer")
def infer(req: InferRequest):
    model = load_model()
    prediction = predict_next(model, req.nextIndex)
    return {"prediction": prediction, "model": model}
