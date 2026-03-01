from typing import List, Dict


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
