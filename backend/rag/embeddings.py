"""
embeddings.py
-------------
Uses the HuggingFace Inference API for embeddings — zero local memory needed.
Falls back to local model if HF_API_TOKEN is not set (for local development).
Includes retry logic for API cold starts.
"""

import os
import time

# ---------------------------------------------------------------------------
# "all-MiniLM-L6-v2" gives a good balance of speed and quality (384-dim).
# ---------------------------------------------------------------------------
_MODEL_NAME = "all-MiniLM-L6-v2"

_embeddings_instance = None


class RetryHFInferenceEmbeddings:
    """Wrapper around HuggingFaceInferenceAPIEmbeddings with automatic retry."""

    def __init__(self, api_key, model_name, max_retries=3, retry_delay=5):
        from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings
        self._inner = HuggingFaceInferenceAPIEmbeddings(
            api_key=api_key,
            model_name=model_name,
        )
        self._max_retries = max_retries
        self._retry_delay = retry_delay

    def _retry(self, func, *args, **kwargs):
        last_error = None
        for attempt in range(self._max_retries):
            try:
                result = func(*args, **kwargs)
                if result:
                    return result
            except Exception as e:
                last_error = e
                print(f"[Embeddings] Attempt {attempt + 1}/{self._max_retries} failed: {e}")
            if attempt < self._max_retries - 1:
                print(f"[Embeddings] Retrying in {self._retry_delay}s (model may be loading)...")
                time.sleep(self._retry_delay)
        raise last_error or RuntimeError("Embedding API returned empty response after retries")

    def embed_documents(self, texts):
        return self._retry(self._inner.embed_documents, texts)

    def embed_query(self, text):
        return self._retry(self._inner.embed_query, text)


def get_embeddings():
    """Return a singleton embeddings instance. Uses API in production, local in dev."""
    global _embeddings_instance
    if _embeddings_instance is not None:
        return _embeddings_instance

    hf_token = os.getenv("HF_API_TOKEN")

    if hf_token:
        # Production: Use HuggingFace Inference API (zero local memory) with retries
        _embeddings_instance = RetryHFInferenceEmbeddings(
            api_key=hf_token,
            model_name=f"sentence-transformers/{_MODEL_NAME}",
            max_retries=3,
            retry_delay=5,
        )
        print("[Embeddings] Using HuggingFace Inference API (cloud) with retry")
    else:
        # Local development: Load model into memory
        from langchain_community.embeddings import HuggingFaceEmbeddings
        os.environ["HF_HOME"] = os.path.join(os.path.dirname(__file__), "..", "..", ".hf_cache")
        _embeddings_instance = HuggingFaceEmbeddings(
            model_name=_MODEL_NAME,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
        print("[Embeddings] Using local HuggingFace model")

    return _embeddings_instance
