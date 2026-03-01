from typing import Dict


def predict_next(model: Dict[str, float], next_index: int) -> float:
    return model["alpha"] + model["beta"] * next_index
