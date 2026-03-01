from typing import List


def risk_parity_weights(volatilities: List[float]) -> List[float]:
    if len(volatilities) < 2:
        raise ValueError("Need at least 2 assets for risk parity")
    if any(v <= 0 for v in volatilities):
        raise ValueError("Volatilities must be positive")

    inverse_vol = [1.0 / volatility for volatility in volatilities]
    total = sum(inverse_vol)
    return [value / total for value in inverse_vol]
