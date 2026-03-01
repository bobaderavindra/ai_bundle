import json
from pathlib import Path
from typing import Dict


MODEL_FILE = Path("/app/models/latest_model.json")


def save_model(model: Dict[str, float]) -> None:
    MODEL_FILE.parent.mkdir(parents=True, exist_ok=True)
    MODEL_FILE.write_text(json.dumps(model), encoding="utf-8")


def load_model() -> Dict[str, float]:
    if not MODEL_FILE.exists():
        return {"alpha": 0.0, "beta": 1.0}
    return json.loads(MODEL_FILE.read_text(encoding="utf-8"))
