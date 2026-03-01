from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List

from var_engine.calculate_var import historical_var
from drawdown.calculate_drawdown import max_drawdown

app = FastAPI(title="InvestAI Risk Service", version="1.0.0")


class VarRequest(BaseModel):
    returns: List[float] = Field(min_length=1)
    confidence: float = Field(default=0.95, gt=0.5, lt=0.999)


class DrawdownRequest(BaseModel):
    prices: List[float] = Field(min_length=1)


@app.get("/health")
def health():
    return {"status": "up"}


@app.post("/risk/var")
def calculate_var(request: VarRequest):
    try:
        return {
            "confidence": request.confidence,
            "var": historical_var(request.returns, request.confidence)
        }
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex)) from ex


@app.post("/risk/drawdown")
def calculate_drawdown(request: DrawdownRequest):
    try:
        return {"maxDrawdown": max_drawdown(request.prices)}
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex)) from ex
