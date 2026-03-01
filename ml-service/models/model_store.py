import json
from pathlib import Path
from typing import Dict, Any


LSTM_MODEL_FILE = Path("/app/models/lstm_model.json")
TRANSFORMER_MODEL_FILE = Path("/app/models/transformer_model.json")
MODEL_META_FILE = Path("/app/models/model_meta.json")


def _write_json(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload), encoding="utf-8")


def _read_json(path: Path, default: Dict[str, Any]) -> Dict[str, Any]:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def save_models(lstm_model: Dict[str, float], transformer_model: Dict[str, float], meta: Dict[str, Any]) -> None:
    _write_json(LSTM_MODEL_FILE, lstm_model)
    _write_json(TRANSFORMER_MODEL_FILE, transformer_model)
    _write_json(MODEL_META_FILE, meta)


def load_lstm_model() -> Dict[str, float]:
    return _read_json(LSTM_MODEL_FILE, {"alpha": 0.0, "beta": 1.0, "type": "lstm"})


def load_transformer_model() -> Dict[str, float]:
    return _read_json(TRANSFORMER_MODEL_FILE, {"alpha": 0.0, "beta": 1.0, "type": "transformer"})


def load_model_info() -> Dict[str, Any]:
    default = {
        "lstmLoaded": LSTM_MODEL_FILE.exists(),
        "transformerLoaded": TRANSFORMER_MODEL_FILE.exists(),
        "trainedAt": None,
        "dataPoints": 0,
        "modelTypes": ["lstm", "transformer"],
    }
    loaded = _read_json(MODEL_META_FILE, default)
    loaded["lstmLoaded"] = LSTM_MODEL_FILE.exists()
    loaded["transformerLoaded"] = TRANSFORMER_MODEL_FILE.exists()
    return loaded
