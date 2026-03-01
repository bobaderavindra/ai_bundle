from typing import Dict


def predict_next(model: Dict[str, float], next_index: int) -> float:
    return model["alpha"] + model["beta"] * next_index


def predict_with_confidence(
        lstm_model: Dict[str, float],
        transformer_model: Dict[str, float],
        next_index: int
) -> Dict[str, float]:
    lstm_prediction = predict_next(lstm_model, next_index)
    transformer_prediction = predict_next(transformer_model, next_index)
    ensemble_prediction = (lstm_prediction * 0.5) + (transformer_prediction * 0.5)

    spread = abs(lstm_prediction - transformer_prediction)
    scale = max(abs(ensemble_prediction), 1.0)
    normalized_spread = min(spread / scale, 1.0)
    confidence = max(0.5, min(0.99, 1.0 - normalized_spread))

    return {
        "prediction": ensemble_prediction,
        "confidence": confidence,
        "lstmPrediction": lstm_prediction,
        "transformerPrediction": transformer_prediction,
    }
