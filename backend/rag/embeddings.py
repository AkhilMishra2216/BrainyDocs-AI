"""
embeddings.py
-------------
Uses the HuggingFace Inference API for embeddings — zero local memory needed.
Falls back to local model if HF_API_TOKEN is not set (for local development).
Includes retry logic for API cold starts and robust error handling.
"""

import os
import time
from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings

# ---------------------------------------------------------------------------
# "all-MiniLM-L6-v2" gives a good balance of speed and quality (384-dim).
# ---------------------------------------------------------------------------
_MODEL_NAME = "all-MiniLM-L6-v2"

_embeddings_instance = None


class RetryHFInferenceEmbeddings:
    """Wrapper around HuggingFaceInferenceAPIEmbeddings with automatic retry."""

    def __init__(self, api_key, model_name, max_retries=5, retry_delay=5):
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
                print(f"[Embeddings] Attempt {attempt + 1}/{self._max_retries} failed: {type(e).__name__} - {str(e)}")
            
            if attempt < self._max_retries - 1:
                print(f"[Embeddings] Retrying in {self._retry_delay}s (waiting for HF API)...")
                time.sleep(self._retry_delay)
                
        raise RuntimeError(f"Embedding API failed after {self._max_retries} retries. Last error: {str(last_error)}")

    def embed_documents(self, texts):
        # Process in batches of 32 to avoid timeouts
        all_embeddings = []
        batch_size = 32
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            result = self._retry(self._inner.embed_documents, batch)
            all_embeddings.extend(result)
        return all_embeddings

    def embed_query(self, text):
        return self._retry(self._inner.embed_query, text)

    def warm_up(self):
        try:
            print("[Embeddings] Warming up HuggingFace model...")
            self.embed_query("warm up")
            print("[Embeddings] Model is ready!")
        except Exception as e:
            print(f"[Embeddings] Warm-up failed (will retry on first real call): {e}")


def get_embeddings():
    """Return a singleton embeddings instance. Uses API in production, local in dev."""
    global _embeddings_instance
    if _embeddings_instance is not None:
        return _embeddings_instance

    hf_token = os.getenv("HF_API_TOKEN")

    if hf_token:
        # Production: Use HuggingFace Inference API (cloud) with retries
        _embeddings_instance = RetryHFInferenceEmbeddings(
            api_key=hf_token,
            model_name=f"sentence-transformers/{_MODEL_NAME}",
            max_retries=5,
            retry_delay=5,
        )
        # Warm up on first load
        _embeddings_instance.warm_up()
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
