"""
embeddings.py
-------------
Uses the HuggingFace Inference API for embeddings via raw requests to debug the response.
"""

import os
import time
import requests

_MODEL_NAME = "all-MiniLM-L6-v2"
_embeddings_instance = None

class DebugHFEmbeddings:
    def __init__(self, api_key, model_name):
        self.api_url = f"https://router.huggingface.co/hf-inference/models/{model_name}/pipeline/feature-extraction"
        self.headers = {"Authorization": f"Bearer {api_key}"}

    def _call_api(self, texts):
        print(f"[Embeddings] Hitting {self.api_url} with {len(texts)} texts...")
        response = requests.post(
            self.api_url,
            headers=self.headers,
            json={"inputs": texts, "options": {"wait_for_model": True}},
            timeout=120
        )
        print(f"[Embeddings] HTTP {response.status_code}")
        print(f"[Embeddings] Raw Response: {response.text[:500]}")
        
        if response.status_code != 200:
            raise RuntimeError(f"HF API Error {response.status_code}: {response.text[:200]}")
            
        try:
            return response.json()
        except Exception as e:
            raise RuntimeError(f"Failed to parse JSON. Response was: {response.text[:200]}")

    def embed_documents(self, texts):
        all_embeddings = []
        batch_size = 32
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            # Simple retry loop
            for attempt in range(5):
                try:
                    result = self._call_api(batch)
                    all_embeddings.extend(result)
                    break
                except Exception as e:
                    print(f"[Embeddings] Attempt {attempt+1}/5 failed: {str(e)}")
                    if attempt == 4:
                        raise
                    time.sleep(5)
                    
        return all_embeddings

    def embed_query(self, text):
        for attempt in range(5):
            try:
                result = self._call_api([text])
                return result[0]
            except Exception as e:
                print(f"[Embeddings] Query Attempt {attempt+1}/5 failed: {str(e)}")
                if attempt == 4:
                    raise
                time.sleep(5)

    def warm_up(self):
        try:
            print("[Embeddings] Warming up...")
            self._call_api(["warm up"])
            print("[Embeddings] Warm-up success!")
        except Exception as e:
            print(f"[Embeddings] Warm-up failed: {str(e)}")

def get_embeddings():
    global _embeddings_instance
    if _embeddings_instance is not None:
        return _embeddings_instance

    hf_token = os.getenv("HF_API_TOKEN")

    if hf_token:
        _embeddings_instance = DebugHFEmbeddings(
            api_key=hf_token,
            model_name=f"sentence-transformers/{_MODEL_NAME}"
        )
        _embeddings_instance.warm_up()
    else:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        os.environ["HF_HOME"] = os.path.join(os.path.dirname(__file__), "..", "..", ".hf_cache")
        _embeddings_instance = HuggingFaceEmbeddings(
            model_name=_MODEL_NAME,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    return _embeddings_instance
