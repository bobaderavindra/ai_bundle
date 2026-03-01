import hashlib
from typing import List

import numpy as np


def tokenize(text: str) -> List[str]:
    return [token.lower() for token in text.split() if token.strip()]


def embed_text(text: str, dim: int = 128) -> np.ndarray:
    vector = np.zeros(dim, dtype=np.float32)
    for token in tokenize(text):
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        idx = int.from_bytes(digest[:4], byteorder="big", signed=False) % dim
        sign = 1.0 if digest[4] % 2 == 0 else -1.0
        vector[idx] += sign
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm
    return vector
