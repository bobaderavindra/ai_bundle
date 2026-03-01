from typing import List


def generate_answer(question: str, contexts: List[str]) -> str:
    if not contexts:
        return "No relevant research context found."
    combined = " ".join(contexts)
    return f"Question: {question}\nContext Summary: {combined[:500]}"
