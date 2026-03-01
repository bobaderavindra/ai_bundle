from typing import List
import math
import random
import statistics


def historical_var(returns: List[float], confidence: float = 0.95) -> float:
    if not returns:
        raise ValueError("returns must not be empty")
    sorted_returns = sorted(returns)
    index = max(0, min(len(sorted_returns) - 1, math.floor((1 - confidence) * len(sorted_returns))))
    return abs(sorted_returns[index])


def monte_carlo_var(
        returns: List[float],
        confidence: float = 0.95,
        simulations: int = 5000,
        horizon_days: int = 1,
        random_seed: int = 42
) -> float:
    if not returns:
        raise ValueError("returns must not be empty")
    if simulations < 100:
        raise ValueError("simulations must be >= 100")
    if horizon_days < 1:
        raise ValueError("horizon_days must be >= 1")

    mean = statistics.fmean(returns)
    std_dev = statistics.pstdev(returns)
    generator = random.Random(random_seed)

    simulated_returns = []
    for _ in range(simulations):
        cumulative = 1.0
        for _ in range(horizon_days):
            sampled = generator.gauss(mean, std_dev)
            cumulative *= (1.0 + sampled)
        period_return = cumulative - 1.0
        simulated_returns.append(period_return)

    sorted_returns = sorted(simulated_returns)
    index = max(0, min(len(sorted_returns) - 1, math.floor((1 - confidence) * len(sorted_returns))))
    return abs(sorted_returns[index])
