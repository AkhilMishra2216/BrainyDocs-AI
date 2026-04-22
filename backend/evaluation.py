"""
evaluation.py
-------------
Script to evaluate the retrieval performance of the BrainyDocs AI FAISS vector store.
Calculates Precision@K and Recall@K using a sample evaluation dataset.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag.vector_store import get_vector_store

# Sample evaluation dataset
# In a real-world scenario, this would be loaded from a JSON/CSV file containing
# human-annotated pairs of (query, expected_chunk_content_substrings)
EVAL_DATASET = [
    {
        "query": "What is Retrieval-Augmented Generation?",
        "expected_substrings": ["Retrieval-Augmented Generation", "RAG"]
    },
    {
        "query": "How does FAISS work?",
        "expected_substrings": ["FAISS", "similarity search", "dense vector"]
    }
]

def calculate_metrics(retrieved_docs, expected_substrings, k=5):
    """
    Calculates Precision and Recall at K.
    A retrieved document is considered a 'hit' if it contains any of the expected substrings.
    """
    if not retrieved_docs:
        return 0.0, 0.0

    retrieved_docs = retrieved_docs[:k]
    hits = 0
    
    for doc in retrieved_docs:
        content = doc.page_content.lower()
        if any(sub.lower() in content for sub in expected_substrings):
            hits += 1

    # Precision@K: Fraction of retrieved documents that are relevant
    precision = hits / len(retrieved_docs)
    
    # Recall@K: Fraction of relevant documents that were retrieved. 
    # For this simplified mock, we assume there's exactly 1 relevant document per query
    # in the ground truth, so max recall is 1.0 if hits > 0 else 0.0.
    recall = 1.0 if hits > 0 else 0.0

    return precision, recall


def run_evaluation(k=5):
    print(f"--- Running RAG Retrieval Evaluation (K={k}) ---")
    store = get_vector_store()
    
    if store is None:
        print("Error: FAISS vector store not found. Please upload documents first.")
        return

    total_precision = 0.0
    total_recall = 0.0

    for idx, item in enumerate(EVAL_DATASET):
        query = item["query"]
        expected = item["expected_substrings"]
        
        print(f"\nQuery {idx + 1}: '{query}'")
        retrieved_docs = store.similarity_search(query, k=k)
        
        p, r = calculate_metrics(retrieved_docs, expected, k=k)
        print(f"  Precision@{k}: {p:.2f}")
        print(f"  Recall@{k}:    {r:.2f}")
        
        total_precision += p
        total_recall += r

    avg_precision = total_precision / len(EVAL_DATASET)
    avg_recall = total_recall / len(EVAL_DATASET)

    print("\n--- Final Results ---")
    print(f"Average Precision@{k}: {avg_precision:.2f}")
    print(f"Average Recall@{k}:    {avg_recall:.2f}")

if __name__ == "__main__":
    run_evaluation(k=3)
