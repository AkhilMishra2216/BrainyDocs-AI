import requests

url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
res = requests.post(url, json={"inputs": ["test"]})
print(f"Pipeline: {res.status_code} {res.text}")

url2 = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
res2 = requests.post(url2, json={"inputs": ["test"]})
print(f"Models: {res2.status_code} {res2.text}")
