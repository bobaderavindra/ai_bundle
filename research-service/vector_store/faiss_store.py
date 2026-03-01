from dataclasses import dataclass
from threading import Lock
from typing import Dict, List

import faiss
import numpy as np

from embeddings.simple_embedder import embed_text


@dataclass
class ChunkRecord:
    doc_id: str
    chunk: str


class FaissVectorStore:
    def __init__(self, dim: int = 128) -> None:
        self.dim = dim
        self._lock = Lock()
        self._records: List[ChunkRecord] = []
        self._index = faiss.IndexFlatIP(dim)
        self._doc_to_indices: Dict[str, List[int]] = {}

    def upsert(self, doc_id: str, chunks: List[str]) -> int:
        with self._lock:
            # Remove old records for this doc and rebuild index.
            self._records = [record for record in self._records if record.doc_id != doc_id]
            self._records.extend(ChunkRecord(doc_id=doc_id, chunk=chunk) for chunk in chunks)
            self._rebuild_index()
            return len(chunks)

    def query(self, question: str, top_k: int = 3) -> List[dict]:
        with self._lock:
            if not self._records:
                return []

            qvec = embed_text(question, self.dim).reshape(1, self.dim)
            scores, indices = self._index.search(qvec.astype(np.float32), top_k)

            results: List[dict] = []
            for score, idx in zip(scores[0], indices[0]):
                if idx < 0 or idx >= len(self._records):
                    continue
                record = self._records[idx]
                results.append(
                    {
                        "docId": record.doc_id,
                        "chunk": record.chunk,
                        "score": float(score),
                    }
                )
            return results

    def _rebuild_index(self) -> None:
        self._index.reset()
        self._doc_to_indices.clear()
        if not self._records:
            return

        matrix = np.vstack([embed_text(record.chunk, self.dim) for record in self._records]).astype(np.float32)
        self._index.add(matrix)
        for i, record in enumerate(self._records):
            self._doc_to_indices.setdefault(record.doc_id, []).append(i)
