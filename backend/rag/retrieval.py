"""
retrieval.py
------------
High-level retrieval helpers that sit on top of the vector store.
Provides formatted context strings ready for injection into LLM prompts.
"""

from rag.vector_store import similarity_search


def retrieve_context(query: str, k: int = 5) -> list[dict]:
    """
    Retrieve the top-k chunks most relevant to *query* and return them
    as a list of dicts with 'content' and 'metadata' keys.
    """
    docs = similarity_search(query, k=k)
    results = []
    for i, doc in enumerate(docs):
        results.append(
            {
                "id": i + 1,
                "content": doc.page_content,
                "metadata": doc.metadata,
            }
        )
    return results


def format_context_for_prompt(chunks: list[dict]) -> str:
    """
    Turn retrieved chunks into a numbered context block that an LLM
    can reference by [Source N].
    """
    if not chunks:
        return "No relevant documents found in the knowledge base."

    parts = []
    for chunk in chunks:
        source_label = chunk["metadata"].get("filename", "Unknown")
        parts.append(
            f"[Source {chunk['id']}] ({source_label}):\n{chunk['content']}"
        )
    return "\n\n---\n\n".join(parts)
