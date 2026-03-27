from fastapi import FastAPI, HTTPException
import uvicorn
from pydantic import BaseModel, Field
from typing import List

from data.portfolio_market_data import fetch_trade_prices
from drawdown.calculate_drawdown import max_drawdown
from messaging.kafka_bus import KafkaBus
from risk_engine.returns import prices_to_returns
from var_engine.calculate_var import historical_var, monte_carlo_var

app = FastAPI(title="InvestAI Risk Service", version="1.0.0")
kafka_bus = KafkaBus()


class VarRequest(BaseModel):
    returns: List[float] = Field(min_length=1)
    confidence: float = Field(default=0.95, gt=0.5, lt=0.999)


class DrawdownRequest(BaseModel):
    prices: List[float] = Field(min_length=1)


@app.get("/health")
def health():
    return {"status": "up"}


@app.on_event("startup")
def startup() -> None:
    kafka_bus.start()


@app.on_event("shutdown")
def shutdown() -> None:
    kafka_bus.shutdown()


@app.post("/risk/var")
def calculate_var(request: VarRequest):
    kafka_bus.publish(
        "risk.var.requested",
        {"confidence": request.confidence, "sampleCount": len(request.returns)},
    )
    try:
        response = {
            "confidence": request.confidence,
            "var": historical_var(request.returns, request.confidence)
        }
        kafka_bus.publish(
            "risk.var.completed",
            {"confidence": request.confidence, "sampleCount": len(request.returns), "var": response["var"]},
        )
        return response
    except ValueError as ex:
        kafka_bus.publish("risk.var.failed", {"error": str(ex)})
        raise HTTPException(status_code=400, detail=str(ex)) from ex


@app.get("/risk/var/{portfolio_id}")
def calculate_var_for_portfolio(portfolio_id: str, confidence: float = 0.95, simulations: int = 5000):
    kafka_bus.publish(
        "risk.var_portfolio.requested",
        {"portfolioId": portfolio_id, "confidence": confidence, "simulations": simulations},
        key=portfolio_id,
    )
    try:
        prices = fetch_trade_prices(portfolio_id)
        returns = prices_to_returns(prices)
        historical = historical_var(returns, confidence)
        monte_carlo = monte_carlo_var(returns, confidence, simulations=simulations)
        response = {
            "portfolioId": portfolio_id,
            "confidence": confidence,
            "samples": len(returns),
            "historicalVar": historical,
            "monteCarloVar": monte_carlo,
        }
        kafka_bus.publish(
            "risk.var_portfolio.completed",
            {
                "portfolioId": portfolio_id,
                "confidence": confidence,
                "samples": len(returns),
                "historicalVar": historical,
                "monteCarloVar": monte_carlo,
            },
            key=portfolio_id,
        )
        return response
    except ValueError as ex:
        kafka_bus.publish("risk.var_portfolio.failed", {"portfolioId": portfolio_id, "error": str(ex)}, key=portfolio_id)
        raise HTTPException(status_code=400, detail=str(ex)) from ex
    except Exception as ex:
        kafka_bus.publish("risk.var_portfolio.failed", {"portfolioId": portfolio_id, "error": str(ex)}, key=portfolio_id)
        raise HTTPException(status_code=500, detail=f"Failed to compute VaR: {str(ex)}") from ex


@app.post("/risk/drawdown")
def calculate_drawdown(request: DrawdownRequest):
    kafka_bus.publish("risk.drawdown.requested", {"sampleCount": len(request.prices)})
    try:
        result = max_drawdown(request.prices)
        kafka_bus.publish("risk.drawdown.completed", {"sampleCount": len(request.prices), "maxDrawdown": result})
        return {"maxDrawdown": result}
    except ValueError as ex:
        kafka_bus.publish("risk.drawdown.failed", {"error": str(ex)})
        raise HTTPException(status_code=400, detail=str(ex)) from ex


@app.get("/risk/drawdown/{portfolio_id}")
def calculate_drawdown_for_portfolio(portfolio_id: str):
    kafka_bus.publish("risk.drawdown_portfolio.requested", {"portfolioId": portfolio_id}, key=portfolio_id)
    try:
        prices = fetch_trade_prices(portfolio_id)
        if len(prices) < 2:
            raise ValueError("Need at least 2 trade prices to compute drawdown")
        result = {
            "portfolioId": portfolio_id,
            "maxDrawdown": max_drawdown(prices),
            "samples": len(prices),
        }
        kafka_bus.publish(
            "risk.drawdown_portfolio.completed",
            {"portfolioId": portfolio_id, "maxDrawdown": result["maxDrawdown"], "samples": result["samples"]},
            key=portfolio_id,
        )
        return result
    except ValueError as ex:
        kafka_bus.publish("risk.drawdown_portfolio.failed", {"portfolioId": portfolio_id, "error": str(ex)}, key=portfolio_id)
        raise HTTPException(status_code=400, detail=str(ex)) from ex
    except Exception as ex:
        kafka_bus.publish("risk.drawdown_portfolio.failed", {"portfolioId": portfolio_id, "error": str(ex)}, key=portfolio_id)
        raise HTTPException(status_code=500, detail=f"Failed to compute drawdown: {str(ex)}") from ex


@app.get("/risk/events/status")
def events_status():
    return kafka_bus.status()


@app.get("/risk/events/recent")
def recent_events():
    return {"events": kafka_bus.recent_messages()}


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8098, reload=True)
