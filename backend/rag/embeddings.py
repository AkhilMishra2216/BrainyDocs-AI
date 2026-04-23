"""
embeddings.py
-------------
Uses the HuggingFace Inference API for embeddings — zero local memory needed.
Falls back to local model if HF_API_TOKEN is not set (for local development).
Includes retry logic and warm-up for API cold starts.
"""

import os
import time
import requests as req

# ---------------------------------------------------------------------------
# "all-MiniLM-L6-v2" gives a good balance of speed and quality (384-dim).
# ---------------------------------------------------------------------------
_MODEL_NAME = "all-MiniLM-L6-v2"
_HF_MODEL_ID = f"sentence-transformers/{_MODEL_NAME}"

_embeddings_instance = None


class RobustHFInferenceEmbeddings:
    """
    Wrapper that calls the HuggingFace Inference API directly via HTTP.
    Handles cold starts with retry + exponential backoff.
    """

    def __init__(self, api_key, model_id, max_retries=5, initial_delay=3):
        self.api_url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{model_id}"
        self.headers = {"Authorization": f"Bearer {api_key}"}
        self.max_retries = max_retries
        self.initial_delay = initial_delay

    def _call_api(self, texts):
        """Call the HF API with retry logic for cold starts."""
        last_error = None
        delay = self.initial_delay

        for attempt in range(self.max_retries):
            try:
                response = req.post(
                    self.api_url,
                    headers=self.headers,
                    json={"inputs": texts, "options": {"wait_for_model": True}},
                    timeout=120,
                )

                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 503:
                    # Model is loading
                    body = response.json()
                    wait_time = body.get("estimated_time", delay)
                    print(f"[Embeddings] Model loading, waiting {wait_time:.0f}s... (attempt {attempt + 1})")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"[Embeddings] API error {response.status_code}: {response.text[:200]}")
                    last_error = RuntimeError(f"HF API error: {response.status_code}")

            except Exception as e:
                last_error = e
                print(f"[Embeddings] Attempt {attempt + 1}/{self.max_retries} failed: {e}")

            if attempt < self.max_retries - 1:
                print(f"[Embeddings] Retrying in {delay}s...")
                time.sleep(delay)
                delay = min(delay * 2, 30)  # exponential backoff, max 30s

        raise last_error or RuntimeError("Embedding API failed after all retries")

    def embed_documents(self, texts):
        """Embed a list of texts."""
        # Process in batches of 32 to avoid timeouts
        all_embeddings = []
        batch_size = 32
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            result = self._call_api(batch)
            all_embeddings.extend(result)
        return all_embeddings

    def embed_query(self, text):
        """Embed a single query text."""
        result = self._call_api([text])
        return result[0]

    def warm_up(self):
        """Send a tiny request to wake the model up."""
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
        # Production: Use HuggingFace Inference API (zero local memory) with retries
        _embeddings_instance = RobustHFInferenceEmbeddings(
            api_key=hf_token,
            model_id=_HF_MODEL_ID,
            max_retries=5,
            initial_delay=3,
        )
        # Warm up on first load so model is ready for uploads
        _embeddings_instance.warm_up()
        print("[Embeddings] Using HuggingFace Inference API (cloud)")
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
