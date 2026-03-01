from typing import List


def max_drawdown(prices: List[float]) -> float:
    if not prices:
        raise ValueError("prices must not be empty")

    peak = prices[0]
    worst = 0.0
    for price in prices:
        peak = max(peak, price)
        drawdown = (peak - price) / peak if peak else 0.0
        worst = max(worst, drawdown)
    return worst
