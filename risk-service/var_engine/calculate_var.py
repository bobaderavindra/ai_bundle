from typing import List
import math


def historical_var(returns: List[float], confidence: float = 0.95) -> float:
    if not returns:
        raise ValueError("returns must not be empty")
    sorted_returns = sorted(returns)
    index = max(0, min(len(sorted_returns) - 1, math.floor((1 - confidence) * len(sorted_returns))))
    return abs(sorted_returns[index])
