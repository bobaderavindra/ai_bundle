import os
from typing import List, Dict

import requests


def generate_answer_with_llm(question: str, retrieved: List[Dict[str, object]]) -> str:
    contexts = [str(item.get("chunk", "")) for item in retrieved]
    if not contexts:
        return "No relevant research context found."

    openai_api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    if openai_api_key:
        try:
            context_block = "\n\n".join(contexts[:5])
            prompt = (
                "You are a financial research assistant.\n"
                "Answer the user's question only from the provided context.\n"
                "If context is insufficient, say what is missing.\n\n"
                f"Context:\n{context_block}\n\n"
                f"Question:\n{question}"
            )
            response = requests.post(
                "https://api.openai.com/v1/responses",
                headers={
                    "Authorization": f"Bearer {openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "input": prompt,
                    "temperature": 0.2,
                },
                timeout=20,
            )
            response.raise_for_status()
            payload = response.json()
            if "output_text" in payload and payload["output_text"]:
                return str(payload["output_text"])
        except Exception:
            pass

    # Fallback local summarization if external LLM call is not configured or fails.
    joined = " ".join(contexts)
    return f"Question: {question}\nAnswer (retrieval summary): {joined[:900]}"
