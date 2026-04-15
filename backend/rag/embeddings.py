"""
embeddings.py
-------------
Thin wrapper around a local HuggingFace Sentence Transformer model
so every module uses the same embedding instance.
"""

import os
os.environ["HF_HOME"] = os.path.join(os.path.dirname(__file__), "..", "..", ".hf_cache")

from langchain_community.embeddings import HuggingFaceEmbeddings

# ---------------------------------------------------------------------------
# The model is downloaded on first use and cached locally.
# "all-MiniLM-L6-v2" gives a good balance of speed and quality (384-dim).
# ---------------------------------------------------------------------------
_MODEL_NAME = "all-MiniLM-L6-v2"

_embeddings_instance = None


def get_embeddings() -> HuggingFaceEmbeddings:
    """Return a singleton HuggingFaceEmbeddings instance."""
    global _embeddings_instance
    if _embeddings_instance is None:
        _embeddings_instance = HuggingFaceEmbeddings(
            model_name=_MODEL_NAME,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    return _embeddings_instance
