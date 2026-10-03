import requests
import sys

# Configure UTF-8 for Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

url = "http://localhost:8000/api/convert"

with open("demo_assets/sample_wireframe.png", "rb") as f:
    files = {"file": ("sample_wireframe.png", f, "image/png")}
    data = {"style": "modern"}
    print("Sending sample wireframe to Gemma 4 via /api/convert...")
    response = requests.post(url, files=files, data=data, timeout=120)

if response.status_code == 200:
    res = response.json()
    print("SUCCESS! Model:", res.get("model"), "IsBackup:", res.get("is_backup"))
    print("Code length:", len(res.get("code", "")))
    print("Preview:\n", res.get("code", "")[:300])
else:
    print("Failed with status:", response.status_code, response.text)
