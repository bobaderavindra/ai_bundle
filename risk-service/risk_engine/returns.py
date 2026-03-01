from typing import List


def prices_to_returns(prices: List[float]) -> List[float]:
    if len(prices) < 2:
        raise ValueError("Need at least 2 price points for return calculation")

    returns: List[float] = []
    for prev, curr in zip(prices[:-1], prices[1:]):
        if prev == 0:
            raise ValueError("Encountered zero price, cannot compute return")
        returns.append((curr - prev) / prev)
    return returns
