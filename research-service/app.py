import uuid

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
import uvicorn
from pydantic import BaseModel, Field

from document_parser.pdf_parser import extract_text_from_pdf_bytes
from document_parser.text_parser import split_into_chunks
from rag.llm_client import generate_answer_with_llm
from vector_store.faiss_store import FaissVectorStore

app = FastAPI(title="InvestAI Research Service", version="1.0.0")
store = FaissVectorStore(dim=128)


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
    retrieved = store.query(req.question, req.topK)
    answer = generate_answer_with_llm(req.question, retrieved)
    return {"answer": answer, "retrieved": retrieved}


@app.post("/upload")
@app.post("/research/upload")
async def upload(file: UploadFile = File(...), docId: str | None = Form(default=None)):
    try:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")

        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        text = extract_text_from_pdf_bytes(content)
        if not text:
            raise HTTPException(status_code=400, detail="No extractable text found in PDF")

        chunks = split_into_chunks(text, chunk_size=600)
        resolved_doc_id = docId or str(uuid.uuid4())
        indexed = store.upsert(resolved_doc_id, chunks)

        return {
            "docId": resolved_doc_id,
            "filename": file.filename,
            "chunksIndexed": indexed,
        }
    except HTTPException:
        raise
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(ex)}") from ex


@app.post("/ask")
@app.post("/research/ask")
def ask(req: QueryRequest):
    try:
        retrieved = store.query(req.question, req.topK)
        answer = generate_answer_with_llm(req.question, retrieved)
        return {"answer": answer, "retrieved": retrieved}
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Ask failed: {str(ex)}") from ex


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8097, reload=True)
