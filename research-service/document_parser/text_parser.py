from typing import List


def split_into_chunks(text: str, chunk_size: int = 280) -> List[str]:
    text = " ".join(text.split())
    if not text:
        return []
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]
