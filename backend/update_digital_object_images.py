"""
Utility script to upgrade stored digital object URLs to high-quality IIIF endpoints.
"""
import json
import os
import re
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

IIIF_BASE = "https://sites.dlib.nyu.edu/viewer/api/image"
DB_PATH = Path(__file__).resolve().parent / "akkasah_archive.db"


def normalize_image_identifier(identifier: Optional[str]) -> Optional[str]:
    if not identifier or not isinstance(identifier, str):
        return None
    cleaned = identifier.strip().strip("/")
    if not cleaned:
        return None
    cleaned = re.sub(r"/{2,}", "/", cleaned)
    return cleaned


def split_identifier(identifier: str) -> Tuple[str, int]:
    """
    Split identifier into base path and page number.
    """
    parts = identifier.rsplit("/", 1)
    if len(parts) == 2 and parts[1].isdigit():
        return parts[0], int(parts[1])
    return identifier, 1


def build_iiif_urls(identifier: str, page_override: Optional[int] = None) -> Tuple[str, str]:
    base, page = split_identifier(identifier)
    if page_override is not None:
        page = page_override
    base = base.strip("/")
    full = f"{IIIF_BASE}/{base}/{page}/full/full/0/default.jpg"
    thumb = f"{IIIF_BASE}/{base}/{page}/full/!300,300/0/default.jpg"
    return full, thumb


def should_upgrade(url: Optional[str]) -> bool:
    if not url or not isinstance(url, str):
        return True
    return "/viewer/photos/" in url or "mode/thumb" in url


def upgrade_object(obj: Dict[str, Any]) -> bool:
    updated = False
    image_id = obj.get("image_id") or obj.get("iiif_identifier")
    image_id = normalize_image_identifier(image_id)

    if image_id:
        full_url, thumb_url = build_iiif_urls(image_id)

        if should_upgrade(obj.get("full_image")) or not obj.get("full_image"):
            obj["full_image"] = full_url
            updated = True

        if should_upgrade(obj.get("thumbnail")) or not obj.get("thumbnail"):
            obj["thumbnail"] = thumb_url
            updated = True

    back_image_id = obj.get("back_image_id")
    back_image_id = normalize_image_identifier(back_image_id)
    if back_image_id:
        back_full, back_thumb = build_iiif_urls(back_image_id, page_override=2)
        if should_upgrade(obj.get("back_full_image")) or not obj.get("back_full_image"):
            obj["back_full_image"] = back_full
            updated = True
        if should_upgrade(obj.get("back_thumbnail")) or not obj.get("back_thumbnail"):
            obj["back_thumbnail"] = back_thumb
            updated = True

    return updated


def upgrade_table(conn: sqlite3.Connection, table: str) -> int:
    cursor = conn.cursor()
    cursor.execute(f"SELECT id, digital_objects FROM {table} WHERE digital_objects IS NOT NULL")
    rows = cursor.fetchall()
    total_updated = 0

    for row_id, payload in rows:
        try:
            objects = json.loads(payload) if isinstance(payload, str) else payload
        except Exception:
            continue

        if not isinstance(objects, list):
            continue

        changed = False
        for obj in objects:
            if isinstance(obj, dict) and upgrade_object(obj):
                changed = True

        if changed:
            cursor.execute(
                f"UPDATE {table} SET digital_objects = ? WHERE id = ?",
                (json.dumps(objects, ensure_ascii=False), row_id),
            )
            total_updated += 1

    conn.commit()
    return total_updated


def main():
    if not DB_PATH.exists():
        raise SystemExit(f"Database not found at {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    try:
        tables = ["archive_collections", "archive_series", "archive_files"]
        for table in tables:
            updated = upgrade_table(conn, table)
            print(f"{table}: updated {updated} rows")
    finally:
        conn.close()


if __name__ == "__main__":
    main()

