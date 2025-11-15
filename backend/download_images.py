import os
import json
import hashlib
import concurrent.futures
from urllib.parse import urlparse
import requests

BASE_URL = os.environ.get("AKKASAH_API", "http://127.0.0.1:8000")
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static", "images")
os.makedirs(STATIC_DIR, exist_ok=True)

def hash_href(href: str) -> str:
    return hashlib.sha1(href.encode("utf-8")).hexdigest()

def ext_from_href(href: str) -> str:
    path = urlparse(href).path
    ext = os.path.splitext(path)[1].lower() or ".jpg"
    if ext == ".jpeg":
        return ".jpg"
    return ext

def fetch_collections():
    resp = requests.get(f"{BASE_URL}/api/archive/collections", timeout=30)
    resp.raise_for_status()
    return resp.json()

def collect_image_hrefs(collections):
    hrefs = set()
    for coll in collections:
        # Collection-level digital_objects
        for obj in (coll.get("digital_objects") or []):
            href = obj.get("href")
            if href and "hdl.handle.net" in href:
                hrefs.add(href)
        # File-level digital_objects (from limited files returned)
        for f in (coll.get("files") or []):
            for obj in (f.get("digital_objects") or []):
                href = obj.get("href")
                if href and "hdl.handle.net" in href:
                    hrefs.add(href)
    return sorted(hrefs)

def download_one(href: str):
    try:
        file_hash = hash_href(href)
        ext = ext_from_href(href)
        out_path = os.path.join(STATIC_DIR, f"{file_hash}{ext}")
        if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
            return href, out_path
        # Stream download
        with requests.get(href, timeout=60, stream=True) as r:
            r.raise_for_status()
            with open(out_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
        return href, out_path
    except Exception:
        return None

def main():
    collections = fetch_collections()
    hrefs = collect_image_hrefs(collections)
    mapping = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        for res in ex.map(download_one, hrefs):
            if res:
                href, path = res
                mapping[href] = path
    # Save mapping for reference
    with open(os.path.join(STATIC_DIR, "mapping.json"), "w") as f:
        json.dump(mapping, f, indent=2)
    print(f"Downloaded {len(mapping)} images to {STATIC_DIR}")

if __name__ == "__main__":
    main()



