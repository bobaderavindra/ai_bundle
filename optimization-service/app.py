from __future__ import annotations

from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, model_validator

from engine.mean_variance import (
    build_covariance_matrix,
    optimize_max_sharpe,
    portfolio_return,
    portfolio_volatility,
)
from engine.monte_carlo import simulate_portfolio_paths
from engine.risk_parity import risk_parity_weights
from messaging.kafka_bus import KafkaBus

app = FastAPI(title="InvestAI Optimization Service", version="1.0.0")
kafka_bus = KafkaBus()


class AssetInput(BaseModel):
    symbol: str = Field(min_length=1)
    expectedReturn: float
    volatility: float = Field(gt=0)


class MeanVarianceRequest(BaseModel):
    assets: List[AssetInput] = Field(min_length=2)
    correlationMatrix: List[List[float]]
    riskFreeRate: float = 0.0
    iterations: int = Field(default=4000, ge=200, le=20000)

    @model_validator(mode="after")
    def validate_correlation_matrix(self):
        n = len(self.assets)
        if len(self.correlationMatrix) != n:
            raise ValueError("correlationMatrix size must match number of assets")

        for row in self.correlationMatrix:
            if len(row) != n:
                raise ValueError("correlationMatrix must be a square matrix")

        for i in range(n):
            if abs(self.correlationMatrix[i][i] - 1.0) > 1e-6:
                raise ValueError("correlationMatrix diagonal must be 1.0")
            for j in range(n):
                value = self.correlationMatrix[i][j]
                if value < -1 or value > 1:
                    raise ValueError("correlation values must be between -1 and 1")
        return self


class RiskParityRequest(BaseModel):
    assets: List[AssetInput] = Field(min_length=2)


class MonteCarloRequest(BaseModel):
    assets: List[AssetInput] = Field(min_length=2)
    weights: List[float] = Field(min_length=2)
    horizonDays: int = Field(default=252, ge=1, le=2520)
    simulations: int = Field(default=500, ge=10, le=20000)
    initialValue: float = Field(default=1.0, gt=0)

    @model_validator(mode="after")
    def validate_weights(self):
        if len(self.weights) != len(self.assets):
            raise ValueError("weights size must match number of assets")
        if any(weight < 0 for weight in self.weights):
            raise ValueError("weights cannot be negative")
        total = sum(self.weights)
        if abs(total - 1.0) > 1e-6:
            raise ValueError("weights must sum to 1.0")
        return self


class RebalanceRequest(BaseModel):
    currentWeights: List[float] = Field(min_length=2)
    targetWeights: List[float] = Field(min_length=2)
    threshold: float = Field(default=0.02, gt=0, le=0.5)

    @model_validator(mode="after")
    def validate_vectors(self):
        if len(self.currentWeights) != len(self.targetWeights):
            raise ValueError("currentWeights and targetWeights lengths must match")
        return self


@app.get("/health")
def health():
    kafka_status = kafka_bus.status()
    warnings = kafka_status.get("warnings", [])

    if warnings:
        return {
            "status": "degraded",
            "service": "optimization-service",
            "warnings": warnings,
            "kafka": {
                "enabled": kafka_status["enabled"],
                "bootstrapServers": kafka_status["bootstrapServers"],
                "producerConnected": kafka_status["producerConnected"],
                "consumerRunning": kafka_status["consumerRunning"],
                "lastError": kafka_status["lastError"],
            },
        }
    return {"status": "up", "service": "optimization-service"}


@app.on_event("startup")
def startup() -> None:
    kafka_bus.start()


@app.on_event("shutdown")
def shutdown() -> None:
    kafka_bus.shutdown()


def _publish(event_type: str, payload: Dict[str, Any], key: str | None = None) -> None:
    kafka_bus.publish(event_type=event_type, payload=payload, key=key)


@app.post("/optimization/mean-variance")
def mean_variance(request: MeanVarianceRequest):
    _publish(
        "optimization.mean_variance.requested",
        {
            "assetCount": len(request.assets),
            "riskFreeRate": request.riskFreeRate,
            "iterations": request.iterations,
        },
    )
    try:
        expected_returns = [asset.expectedReturn for asset in request.assets]
        volatilities = [asset.volatility for asset in request.assets]
        covariance = build_covariance_matrix(volatilities, request.correlationMatrix)
        weights = optimize_max_sharpe(
            expected_returns=expected_returns,
            covariance_matrix=covariance,
            risk_free_rate=request.riskFreeRate,
            iterations=request.iterations,
        )

        expected = portfolio_return(weights, expected_returns)
        volatility = portfolio_volatility(weights, covariance)
        sharpe = (expected - request.riskFreeRate) / volatility if volatility > 0 else 0.0

        allocation = [
            {"symbol": asset.symbol, "weight": round(weight, 6)}
            for asset, weight in zip(request.assets, weights)
        ]

        response = {
            "suggestedAllocation": allocation,
            "expectedReturn": expected,
            "expectedVolatility": volatility,
            "sharpeRatio": sharpe,
        }
        _publish(
            "optimization.mean_variance.completed",
            {
                "assetCount": len(request.assets),
                "expectedReturn": expected,
                "expectedVolatility": volatility,
                "sharpeRatio": sharpe,
            },
        )
        return response
    except ValueError as ex:
        _publish("optimization.mean_variance.failed", {"error": str(ex)})
        raise HTTPException(status_code=400, detail=str(ex)) from ex


@app.post("/optimization/risk-parity")
def risk_parity(request: RiskParityRequest):
    _publish("optimization.risk_parity.requested", {"assetCount": len(request.assets)})
    try:
        volatilities = [asset.volatility for asset in request.assets]
        weights = risk_parity_weights(volatilities)
        allocation = [
            {"symbol": asset.symbol, "weight": round(weight, 6)}
            for asset, weight in zip(request.assets, weights)
        ]
        response = {"suggestedAllocation": allocation}
        _publish("optimization.risk_parity.completed", {"assetCount": len(request.assets)})
        return response
    except ValueError as ex:
        _publish("optimization.risk_parity.failed", {"error": str(ex)})
        raise HTTPException(status_code=400, detail=str(ex)) from ex


@app.post("/optimization/monte-carlo")
def monte_carlo(request: MonteCarloRequest):
    _publish(
        "optimization.monte_carlo.requested",
        {
            "assetCount": len(request.assets),
            "simulations": request.simulations,
            "horizonDays": request.horizonDays,
        },
    )
    try:
        expected_returns = [asset.expectedReturn for asset in request.assets]
        volatilities = [asset.volatility for asset in request.assets]
        finals = simulate_portfolio_paths(
            weights=request.weights,
            expected_returns=expected_returns,
            volatilities=volatilities,
            horizon_days=request.horizonDays,
            simulations=request.simulations,
            initial_value=request.initialValue,
        )
        finals_sorted = sorted(finals)
        percentile_5 = finals_sorted[max(int(0.05 * len(finals_sorted)) - 1, 0)]
        percentile_50 = finals_sorted[max(int(0.50 * len(finals_sorted)) - 1, 0)]
        percentile_95 = finals_sorted[max(int(0.95 * len(finals_sorted)) - 1, 0)]
        average = sum(finals) / len(finals)

        response = {
            "simulations": request.simulations,
            "horizonDays": request.horizonDays,
            "initialValue": request.initialValue,
            "averageFinalValue": average,
            "p5FinalValue": percentile_5,
            "p50FinalValue": percentile_50,
            "p95FinalValue": percentile_95,
        }
        _publish(
            "optimization.monte_carlo.completed",
            {
                "simulations": request.simulations,
                "horizonDays": request.horizonDays,
                "averageFinalValue": average,
            },
        )
        return response
    except ValueError as ex:
        _publish("optimization.monte_carlo.failed", {"error": str(ex)})
        raise HTTPException(status_code=400, detail=str(ex)) from ex


@app.post("/optimization/rebalance")
def rebalance(request: RebalanceRequest):
    _publish(
        "optimization.rebalance.requested",
        {"positions": len(request.currentWeights), "threshold": request.threshold},
    )
    trades = []
    for idx, (current, target) in enumerate(zip(request.currentWeights, request.targetWeights)):
        delta = target - current
        action = "hold"
        if delta > request.threshold:
            action = "buy"
        elif delta < -request.threshold:
            action = "sell"

        trades.append(
            {
                "index": idx,
                "currentWeight": current,
                "targetWeight": target,
                "delta": delta,
                "action": action,
            }
        )

    response = {"threshold": request.threshold, "actions": trades}
    action_counts = {"buy": 0, "sell": 0, "hold": 0}
    for trade in trades:
        action_counts[trade["action"]] += 1
    _publish("optimization.rebalance.completed", {"threshold": request.threshold, **action_counts})
    return response


@app.get("/optimization/events/recent")
def recent_events():
    return {"events": kafka_bus.recent_messages()}


@app.get("/optimization/events/status")
def events_status():
    return kafka_bus.status()
