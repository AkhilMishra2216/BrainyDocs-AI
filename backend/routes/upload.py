"""
upload.py
---------
File upload endpoint: accepts PDF / DOCX, extracts text,
chunks it, and indexes into the FAISS vector store.
"""

import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from rag.chunking import extract_text, chunk_text
from rag.vector_store import add_documents, delete_from_vector_store
from database import get_db
import models

router = APIRouter(tags=["upload"])

# Temporary directory for incoming files
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-memory document registry is removed - Using MySQL
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}

from routes.auth import get_current_user
from rag.llm import llm
from langchain_core.messages import HumanMessage, SystemMessage
from rag.retrieval import retrieve_context, format_context_for_prompt

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
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

    try:
        # Chunk
        chunks = chunk_text(raw_text)

        # Index into FAISS
        metadata = {"filename": file.filename, "file_id": file_id}
        add_documents(chunks, metadata=metadata)

        # Register in database
        db_doc = models.Document(
            file_id=file_id,
            filename=file.filename,
            chunks=len(chunks),
            characters=len(raw_text)
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        print(f"[Upload Error]: {trace}")
        raise HTTPException(status_code=500, detail=f"Internal error during embedding/indexing: {str(e)}\n\n{trace}")

    return {
        "message": "Document uploaded and indexed successfully.",
        "document": {
            "file_id": db_doc.file_id,
            "filename": db_doc.filename,
            "chunks": db_doc.chunks,
            "characters": db_doc.characters,
            "status": "ready"
        },
    }


@router.get("/documents")
async def list_documents(db: Session = Depends(get_db)):
    """Return all indexed documents."""
    docs = db.query(models.Document).all()
    # Format to match existing payload expectation
    return {"documents": [{"file_id": d.file_id, "filename": d.filename, "chunks": d.chunks, "characters": d.characters} for d in docs]}


@router.delete("/documents/{file_id}")
async def delete_document(file_id: str, db: Session = Depends(get_db)):
    """Remove a document from SQLite and FAISS."""
    doc = db.query(models.Document).filter(models.Document.file_id == file_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    
    # Delete from FAISS
    delete_from_vector_store(file_id)
    
    # Delete from database
    db.delete(doc)
    db.commit()
    return {"message": "Document removed from registry and vector store."}

@router.get("/summary")
async def generate_summary(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    """Generate a high-level summary of all indexed documents using the LLM."""
    docs = db.query(models.Document).all()
    if not docs:
        raise HTTPException(status_code=400, detail="No documents available to summarize.")
    
    file_names = ", ".join([d.filename for d in docs])
    
    chunks = retrieve_context("What are the main topics, entities, and summaries of these documents?", k=15)
    context = format_context_for_prompt(chunks) if chunks else "No content available."
    
    prompt = f"Provide a comprehensive, high-level executive summary of the following document content. The documents included are: {file_names}.\n\nContext:\n{context}"
    
    messages = [
        SystemMessage(content="You are an expert analyst. Summarize the provided document context concisely and professionally in markdown format."),
        HumanMessage(content=prompt)
    ]
    
    response = llm.invoke(messages)
    return {"summary": response.content}
