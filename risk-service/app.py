from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List

from data.portfolio_market_data import fetch_trade_prices
from drawdown.calculate_drawdown import max_drawdown
from risk_engine.returns import prices_to_returns
from var_engine.calculate_var import historical_var, monte_carlo_var

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


@app.get("/risk/var/{portfolio_id}")
def calculate_var_for_portfolio(portfolio_id: str, confidence: float = 0.95, simulations: int = 5000):
    try:
        prices = fetch_trade_prices(portfolio_id)
        returns = prices_to_returns(prices)
        historical = historical_var(returns, confidence)
        monte_carlo = monte_carlo_var(returns, confidence, simulations=simulations)
        return {
            "portfolioId": portfolio_id,
            "confidence": confidence,
            "samples": len(returns),
            "historicalVar": historical,
            "monteCarloVar": monte_carlo,
        }
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex)) from ex
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Failed to compute VaR: {str(ex)}") from ex


@app.post("/risk/drawdown")
def calculate_drawdown(request: DrawdownRequest):
    try:
        return {"maxDrawdown": max_drawdown(request.prices)}
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex)) from ex


@app.get("/risk/drawdown/{portfolio_id}")
def calculate_drawdown_for_portfolio(portfolio_id: str):
    try:
        prices = fetch_trade_prices(portfolio_id)
        if len(prices) < 2:
            raise ValueError("Need at least 2 trade prices to compute drawdown")
        return {
            "portfolioId": portfolio_id,
            "maxDrawdown": max_drawdown(prices),
            "samples": len(prices),
        }
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex)) from ex
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Failed to compute drawdown: {str(ex)}") from ex
