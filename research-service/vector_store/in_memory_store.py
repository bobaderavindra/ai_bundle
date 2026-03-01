from collections import Counter
from math import sqrt
from typing import Dict, List, Tuple


class InMemoryVectorStore:
    def __init__(self) -> None:
        self.docs: Dict[str, List[Tuple[str, Counter]]] = {}

    def upsert(self, doc_id: str, chunks: List[str]) -> int:
        vectors = [(chunk, self._to_vector(chunk)) for chunk in chunks]
        self.docs[doc_id] = vectors
        return len(vectors)

    def query(self, query: str, top_k: int = 3) -> List[str]:
        query_vec = self._to_vector(query)
        scored: List[Tuple[float, str]] = []
        for vectors in self.docs.values():
            for chunk, vec in vectors:
                score = self._cosine(query_vec, vec)
                scored.append((score, chunk))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [chunk for score, chunk in scored[:top_k] if score > 0]

    def _to_vector(self, text: str) -> Counter:
        tokens = [token.lower() for token in text.split() if token.strip()]
        return Counter(tokens)

    def _cosine(self, a: Counter, b: Counter) -> float:
        keys = set(a.keys()) | set(b.keys())
        dot = sum(a[k] * b[k] for k in keys)
        norm_a = sqrt(sum(v * v for v in a.values()))
        norm_b = sqrt(sum(v * v for v in b.values()))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)
