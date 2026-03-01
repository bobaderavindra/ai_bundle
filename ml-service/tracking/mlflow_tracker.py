import json
import os
import tempfile
from typing import Any, Dict

import mlflow
from mlflow.tracking import MlflowClient


def _setup_mlflow() -> None:
    tracking_uri = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")
    experiment_name = os.getenv("MLFLOW_EXPERIMENT_NAME", "investai-ml")
    mlflow.set_tracking_uri(tracking_uri)
    mlflow.set_experiment(experiment_name)


def _ensure_registered_model(client: MlflowClient, model_name: str) -> None:
    try:
        client.get_registered_model(model_name)
    except Exception:
        client.create_registered_model(model_name)


def log_and_register_model(
        model_name: str,
        model_payload: Dict[str, Any],
        metrics: Dict[str, float],
        params: Dict[str, Any]
) -> Dict[str, Any]:
    _setup_mlflow()
    client = MlflowClient()

    with mlflow.start_run(run_name=f"{model_name}-run") as run:
        for key, value in params.items():
            mlflow.log_param(key, value)
        for key, value in metrics.items():
            mlflow.log_metric(key, float(value))

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as tmp:
            json.dump(model_payload, tmp)
            temp_path = tmp.name

        mlflow.log_artifact(temp_path, artifact_path="model")
        artifact_uri = f"runs:/{run.info.run_id}/model/{os.path.basename(temp_path)}"

        _ensure_registered_model(client, model_name)
        model_version = client.create_model_version(
            name=model_name,
            source=artifact_uri,
            run_id=run.info.run_id,
        )

        return {
            "runId": run.info.run_id,
            "modelName": model_name,
            "modelVersion": model_version.version,
            "artifactUri": artifact_uri,
        }
