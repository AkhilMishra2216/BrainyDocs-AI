"""
embeddings.py
-------------
Uses the HuggingFace Inference API for embeddings — zero local memory needed.
Falls back to local model if HF_API_TOKEN is not set (for local development).
"""

import os
from langchain_community.embeddings import HuggingFaceEmbeddings

# ---------------------------------------------------------------------------
# "all-MiniLM-L6-v2" gives a good balance of speed and quality (384-dim).
# ---------------------------------------------------------------------------
_MODEL_NAME = "all-MiniLM-L6-v2"

_embeddings_instance = None

def get_embeddings():
    """Return a singleton embeddings instance. Uses API in production, local in dev."""
    global _embeddings_instance
    if _embeddings_instance is not None:
        return _embeddings_instance

    hf_token = os.getenv("HF_API_TOKEN")

    if hf_token:
        # Production: Use HuggingFace Inference API (zero local memory)
        from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings
        _embeddings_instance = HuggingFaceInferenceAPIEmbeddings(
            api_key=hf_token,
            model_name=f"sentence-transformers/{_MODEL_NAME}",
        )
        print("[Embeddings] Using HuggingFace Inference API (cloud)")
    else:
        # Local development: Load model into memory
        os.environ["HF_HOME"] = os.path.join(os.path.dirname(__file__), "..", "..", ".hf_cache")
        _embeddings_instance = HuggingFaceEmbeddings(
            model_name=_MODEL_NAME,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
        print("[Embeddings] Using local HuggingFace model")

    return _embeddings_instance
