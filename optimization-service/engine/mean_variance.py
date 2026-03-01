import math
import random
from typing import List


def build_covariance_matrix(volatilities: List[float], correlation_matrix: List[List[float]]) -> List[List[float]]:
    n = len(volatilities)
    covariance = [[0.0 for _ in range(n)] for _ in range(n)]
    for i in range(n):
        for j in range(n):
            covariance[i][j] = volatilities[i] * volatilities[j] * correlation_matrix[i][j]
    return covariance


def portfolio_return(weights: List[float], expected_returns: List[float]) -> float:
    return sum(w * r for w, r in zip(weights, expected_returns))


def portfolio_volatility(weights: List[float], covariance_matrix: List[List[float]]) -> float:
    variance = 0.0
    for i in range(len(weights)):
        for j in range(len(weights)):
            variance += weights[i] * weights[j] * covariance_matrix[i][j]
    return math.sqrt(max(variance, 0.0))


def optimize_max_sharpe(
        expected_returns: List[float],
        covariance_matrix: List[List[float]],
        risk_free_rate: float = 0.0,
        iterations: int = 4000,
        random_seed: int = 42
) -> List[float]:
    if len(expected_returns) < 2:
        raise ValueError("Need at least 2 assets for optimization")

    generator = random.Random(random_seed)
    n = len(expected_returns)
    best_weights = [1.0 / n] * n
    best_sharpe = float("-inf")

    for _ in range(iterations):
        raw = [max(generator.random(), 1e-9) for _ in range(n)]
        total = sum(raw)
        weights = [value / total for value in raw]

        expected = portfolio_return(weights, expected_returns)
        volatility = portfolio_volatility(weights, covariance_matrix)
        if volatility <= 1e-9:
            continue

        sharpe = (expected - risk_free_rate) / volatility
        if sharpe > best_sharpe:
            best_sharpe = sharpe
            best_weights = weights

    return best_weights
