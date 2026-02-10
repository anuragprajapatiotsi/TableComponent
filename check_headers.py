import requests
import time

start = time.time()
try:
    with requests.post("http://localhost:8000/query", json={"query": "SELECT pg_sleep(2)", "limit": 10}, stream=True) as r:
        print(f"Headers received after {time.time() - start:.2f}s")
        print("Headers:", r.headers)
        print("Content:", r.text)
except Exception as e:
    print(e)
