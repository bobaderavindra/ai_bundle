from typing import List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from inference.predict import predict_with_confidence
from models.model_store import load_lstm_model, load_model_info, load_transformer_model, save_models
from time_series.finance import (
    credit_card_utilization_forecast,
    detect_anomalies,
    expense_forecast,
    normalize_series,
    spending_patterns,
    trip_budget_projection,
)
from training.train_model import build_model_meta, train_lstm, train_transformer
from tracking.mlflow_tracker import log_and_register_model

app = FastAPI(title="InvestAI ML Service", version="1.0.0")


class TrainRequest(BaseModel):
    prices: List[float] = Field(min_length=2)


class InferRequest(BaseModel):
    nextIndex: int = Field(ge=1)


class TimeSeriesPointRequest(BaseModel):
    date: str
    amount: float
    category: Optional[str] = None


class ExpenseForecastRequest(BaseModel):
    series: List[TimeSeriesPointRequest] = Field(min_length=1)
    periods: int = Field(default=1, ge=1)
    budgetLimit: Optional[float] = Field(default=None, gt=0)


class SpendingPatternRequest(BaseModel):
    series: List[TimeSeriesPointRequest] = Field(min_length=1)


class AnomalyDetectionRequest(BaseModel):
    series: List[TimeSeriesPointRequest] = Field(min_length=1)
    zScoreThreshold: float = Field(default=2.0, gt=0)


class CreditUtilizationForecastRequest(BaseModel):
    series: List[TimeSeriesPointRequest] = Field(min_length=1)
    limitAmount: float = Field(gt=0)
    currentBalance: float = Field(default=0, ge=0)


class TripBudgetProjectionRequest(BaseModel):
    series: List[TimeSeriesPointRequest] = Field(min_length=1)
    tripDays: int = Field(ge=1)
    totalBudget: Optional[float] = Field(default=None, gt=0)


@app.get("/health")
def health():
    return {"status": "up"}


@app.post("/train")
@app.post("/ml/train")
def train(req: TrainRequest):
    try:
        lstm_model = train_lstm(req.prices)
        transformer_model = train_transformer(req.prices)

        lstm_tracking = log_and_register_model(
            model_name="investai_lstm_model",
            model_payload=lstm_model,
            metrics={"beta_abs": abs(lstm_model["beta"])},
            params={"model_type": "lstm", "data_points": len(req.prices)},
        )
        transformer_tracking = log_and_register_model(
            model_name="investai_transformer_model",
            model_payload=transformer_model,
            metrics={"beta_abs": abs(transformer_model["beta"])},
            params={"model_type": "transformer", "data_points": len(req.prices)},
        )

        meta = build_model_meta(req.prices)
        meta["registry"] = {
            "lstm": lstm_tracking,
            "transformer": transformer_tracking,
        }
        save_models(lstm_model, transformer_model, meta)
        return {
            "message": "models trained",
            "models": {
                "lstm": lstm_model,
                "transformer": transformer_model,
            },
            "tracking": meta["registry"],
            "modelInfo": load_model_info(),
        }
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex)) from ex
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(ex)}") from ex


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


@app.post("/time-series/forecast")
@app.post("/ml/time-series/forecast")
def time_series_forecast(req: ExpenseForecastRequest):
    try:
        return expense_forecast(
            normalize_series([point.model_dump() for point in req.series]),
            periods=req.periods,
            budget_limit=req.budgetLimit,
        )
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex)) from ex


@app.post("/time-series/patterns")
@app.post("/ml/time-series/patterns")
def time_series_patterns(req: SpendingPatternRequest):
    try:
        return spending_patterns(normalize_series([point.model_dump() for point in req.series]))
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex)) from ex


@app.post("/time-series/anomalies")
@app.post("/ml/time-series/anomalies")
def time_series_anomalies(req: AnomalyDetectionRequest):
    try:
        return detect_anomalies(
            normalize_series([point.model_dump() for point in req.series]),
            z_score_threshold=req.zScoreThreshold,
        )
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex)) from ex


@app.post("/time-series/credit-utilization")
@app.post("/ml/time-series/credit-utilization")
def time_series_credit_utilization(req: CreditUtilizationForecastRequest):
    try:
        return credit_card_utilization_forecast(
            normalize_series([point.model_dump() for point in req.series]),
            limit_amount=req.limitAmount,
            current_balance=req.currentBalance,
        )
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex)) from ex


@app.post("/time-series/trip-budget")
@app.post("/ml/time-series/trip-budget")
def time_series_trip_budget(req: TripBudgetProjectionRequest):
    try:
        return trip_budget_projection(
            normalize_series([point.model_dump() for point in req.series]),
            trip_days=req.tripDays,
            total_budget=req.totalBudget,
        )
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex)) from ex


if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=8095, reload=True)
