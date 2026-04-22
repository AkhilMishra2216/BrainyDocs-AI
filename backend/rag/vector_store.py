"""
vector_store.py
---------------
Manage a local FAISS index: add documents, persist to disk, and load.
"""

import os
from langchain_community.vectorstores import FAISS
from langchain.schema import Document
from rag.embeddings import get_embeddings

# Directory where the FAISS index files are persisted
INDEX_DIR = os.path.join(os.path.dirname(__file__), "..", "faiss_index")

_vector_store = None

from typing import Optional

def get_vector_store() -> Optional[FAISS]:
    """Return the currently loaded FAISS vector store (or None)."""
    global _vector_store
    if _vector_store is None and os.path.exists(os.path.join(INDEX_DIR, "index.faiss")):
        _vector_store = FAISS.load_local(
            INDEX_DIR,
            get_embeddings(),
            allow_dangerous_deserialization=True,
        )
    return _vector_store


def add_documents(chunks: list[str], metadata: Optional[dict] = None) -> FAISS:
    """
    Embed *chunks*, merge into the existing FAISS index (if any),
    persist to disk, and return the updated store.
    """
    global _vector_store

    docs = [
        Document(page_content=chunk, metadata=metadata or {})
        for chunk in chunks
    ]
    embeddings = get_embeddings()

    if _vector_store is None:
        _vector_store = FAISS.from_documents(docs, embeddings)
    else:
        new_store = FAISS.from_documents(docs, embeddings)
        _vector_store.merge_from(new_store)

    os.makedirs(INDEX_DIR, exist_ok=True)
    _vector_store.save_local(INDEX_DIR)
    return _vector_store


def similarity_search(query: str, k: int = 5) -> list[Document]:
    """Return the top-k most similar documents to *query*."""
    store = get_vector_store()
    if store is None:
        return []
    return store.similarity_search(query, k=k)

def delete_from_vector_store(file_id: str):
    """Remove all vectors from FAISS matching a specific file_id."""
    store = get_vector_store()
    if store is None:
        return

    # Find IDs to remove
    ids_to_remove = []
    for doc_id, doc in store.docstore._dict.items():
        if doc.metadata.get("file_id") == file_id:
            ids_to_remove.append(doc_id)
            
    if ids_to_remove:
        store.delete(ids_to_remove)
        store.save_local(INDEX_DIR)
