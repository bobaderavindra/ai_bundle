from fastapi import FastAPI
from pydantic import BaseModel, Field

from document_parser.text_parser import split_into_chunks
from rag.rag_engine import generate_answer
from vector_store.in_memory_store import InMemoryVectorStore

app = FastAPI(title="InvestAI Research Service", version="1.0.0")
store = InMemoryVectorStore()


class IngestRequest(BaseModel):
    docId: str = Field(min_length=1)
    content: str = Field(min_length=10)


class QueryRequest(BaseModel):
    question: str = Field(min_length=3)
    topK: int = Field(default=3, ge=1, le=10)


@app.get("/health")
def health():
    return {"status": "up"}


@app.post("/research/ingest")
def ingest(req: IngestRequest):
    chunks = split_into_chunks(req.content)
    count = store.upsert(req.docId, chunks)
    return {"docId": req.docId, "chunksIndexed": count}


@app.post("/research/query")
def query(req: QueryRequest):
    contexts = store.query(req.question, req.topK)
    answer = generate_answer(req.question, contexts)
    return {"answer": answer, "contexts": contexts}
