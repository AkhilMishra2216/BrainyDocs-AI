"""
upload.py
---------
File upload endpoint: accepts PDF / DOCX, extracts text,
chunks it, and indexes into the FAISS vector store.
"""

import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from rag.chunking import extract_text, chunk_text
from rag.vector_store import add_documents

router = APIRouter(tags=["upload"])

# Temporary directory for incoming files
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-memory document registry (replaces MongoDB for now)
document_registry: list[dict] = []

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document, extract & chunk its text, and add to the
    FAISS vector store for semantic retrieval.
    """
    # Validate extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {ALLOWED_EXTENSIONS}",
        )

    # Save file to disk
    file_id = str(uuid.uuid4())
    safe_name = f"{file_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Extract text
    try:
        raw_text = extract_text(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {e}")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="No extractable text found in the document.")

    # Chunk
    chunks = chunk_text(raw_text)

    # Index into FAISS
    metadata = {"filename": file.filename, "file_id": file_id}
    add_documents(chunks, metadata=metadata)

    # Register in memory
    doc_info = {
        "file_id": file_id,
        "filename": file.filename,
        "chunks": len(chunks),
        "characters": len(raw_text),
        "status": "ready",
    }
    document_registry.append(doc_info)

    return {
        "message": "Document uploaded and indexed successfully.",
        "document": doc_info,
    }


@router.get("/documents")
async def list_documents():
    """Return all indexed documents."""
    return {"documents": document_registry}


@router.delete("/documents/{file_id}")
async def delete_document(file_id: str):
    """Remove a document from the registry (FAISS rebuild not implemented yet)."""
    global document_registry
    before = len(document_registry)
    document_registry = [d for d in document_registry if d["file_id"] != file_id]
    if len(document_registry) == before:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"message": "Document removed from registry."}
