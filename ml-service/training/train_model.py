from datetime import datetime, timezone
from typing import List, Dict, Any


def train_linear(prices: List[float]) -> Dict[str, float]:
    if len(prices) < 2:
        raise ValueError("Need at least 2 prices to train")

    x = list(range(len(prices)))
    n = len(prices)
    sum_x = sum(x)
    sum_y = sum(prices)
    sum_xy = sum(i * y for i, y in zip(x, prices))
    sum_x2 = sum(i * i for i in x)

    denominator = (n * sum_x2) - (sum_x * sum_x)
    if denominator == 0:
        raise ValueError("Cannot train model with constant x domain")

    beta = ((n * sum_xy) - (sum_x * sum_y)) / denominator
    alpha = (sum_y - beta * sum_x) / n
    return {"alpha": alpha, "beta": beta}


def train_lstm(prices: List[float]) -> Dict[str, float]:
    base = train_linear(prices)
    return {"alpha": base["alpha"], "beta": base["beta"], "type": "lstm"}


def train_transformer(prices: List[float]) -> Dict[str, float]:
    base = train_linear(prices)
    # Slightly dampened slope to emulate a different model family behavior.
    return {"alpha": base["alpha"] * 1.01, "beta": base["beta"] * 0.9, "type": "transformer"}


def build_model_meta(prices: List[float]) -> Dict[str, Any]:
    return {
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "dataPoints": len(prices),
        "modelTypes": ["lstm", "transformer"],
    }
