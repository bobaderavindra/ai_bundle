import math
import random
from typing import List


def simulate_portfolio_paths(
        weights: List[float],
        expected_returns: List[float],
        volatilities: List[float],
        horizon_days: int,
        simulations: int,
        initial_value: float = 1.0,
        random_seed: int = 42
) -> List[float]:
    if horizon_days < 1:
        raise ValueError("horizonDays must be at least 1")
    if simulations < 10:
        raise ValueError("simulations must be at least 10")

    generator = random.Random(random_seed)
    finals: List[float] = []
    daily_expected = [value / 252.0 for value in expected_returns]
    daily_vol = [value / math.sqrt(252.0) for value in volatilities]

    for _ in range(simulations):
        portfolio_value = initial_value
        for _ in range(horizon_days):
            daily_return = 0.0
            for idx, weight in enumerate(weights):
                sampled = generator.gauss(daily_expected[idx], daily_vol[idx])
                daily_return += weight * sampled
            portfolio_value *= max(1.0 + daily_return, 0.0001)
        finals.append(portfolio_value)

    return finals
