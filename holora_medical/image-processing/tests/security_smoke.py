"""Run inside a disposable image-processing container using synthetic image data."""
import json
import os
import urllib.error
import urllib.request
import uuid

import cv2
import numpy as np

base = "http://127.0.0.1:8000/api/v1"
try:
    urllib.request.urlopen(f"{base}/jobs/1")
    raise AssertionError("Anonymous job access was allowed")
except urllib.error.HTTPError as error:
    assert error.code == 401

boundary = uuid.uuid4().hex
image = np.tile(np.arange(128, dtype=np.uint8), (128, 1))
ok, encoded = cv2.imencode(".png", image)
assert ok
body = (
    f"--{boundary}\r\nContent-Disposition: form-data; name=\"source_image_id\"\r\n\r\n1\r\n"
    f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"synthetic.png\"\r\n"
    "Content-Type: image/png\r\n\r\n"
).encode() + encoded.tobytes() + f"\r\n--{boundary}--\r\n".encode()
key = os.environ["INTERNAL_API_KEY"]
request = urllib.request.Request(f"{base}/preprocess", data=body, headers={
    "X-API-Key": key, "Content-Type": f"multipart/form-data; boundary={boundary}",
})
with urllib.request.urlopen(request, timeout=30) as response:
    job = json.load(response)
assert job["status"] == "completed", job
request = urllib.request.Request(f"{base}/jobs/{job['id']}/result", headers={"X-API-Key": key})
with urllib.request.urlopen(request) as response:
    result = json.load(response)
for field in ["processed_image_path", "edge_image_path", "mask_image_path"]:
    assert cv2.imread(result[field]) is not None, field
print("PASS: unauthenticated denial, authenticated processing, three readable output images")
