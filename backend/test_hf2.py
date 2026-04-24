import urllib.request
import json
import os

token = os.environ.get("HF_API_TOKEN", "") # Try without token or dummy

url = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
data = json.dumps({"inputs": "test string"}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        print("Success:", response.read().decode())
except urllib.error.HTTPError as e:
    print(f"Error {e.code}: {e.read().decode()}")

