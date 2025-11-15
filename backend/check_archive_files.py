import argparse
import json
import os
import sqlite3
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ARCHIVE_DIR = BASE_DIR.parent / "ArchiveFiles"
DB_PATH = BASE_DIR / "akkasah_archive.db"

if not os.getenv("DATABASE_URL"):
    os.environ["DATABASE_URL"] = f"sqlite:///{DB_PATH}"

from database import SessionLocal
from models import ArchiveCollection

NS = {"ead": "urn:isbn:1-931666-22-9"}


def normalize_unit_id(value: str | None, fallback: str) -> str:
    if value and value.strip():
        return value.strip()
    return fallback


def get_text(element):
    if element is None:
        return ""
    return " ".join(element.itertext()).strip()


def extract_collection_metadata(xml_path: Path) -> dict | None:
    tree = ET.parse(xml_path)
    root = tree.getroot()
    archdesc = root.find(".//ead:archdesc", NS)
    if archdesc is None:
        return None

    unittitle = archdesc.find(".//ead:unittitle", NS)
    unitid = archdesc.find(".//ead:unitid", NS)
    unitdate = archdesc.find(".//ead:unitdate", NS)
    extent = archdesc.find('.//ead:extent[@altrender="materialtype spaceoccupied"]', NS)
    carrier = archdesc.find('.//ead:extent[@altrender="carrier"]', NS)
    abstract = archdesc.find(".//ead:abstract", NS)
    scopecontent = archdesc.find(".//ead:scopecontent", NS)
    bioghist = archdesc.find(".//ead:bioghist", NS)

    languages = []
    for lang in archdesc.findall(".//ead:language", NS):
        languages.append(
            {
                "code": lang.attrib.get("langcode", ""),
                "script": lang.attrib.get("scriptcode", ""),
                "text": get_text(lang),
            }
        )

    containers = []
    for container in archdesc.findall(".//ead:container", NS):
        containers.append(
            {
                "type": container.attrib.get("type", ""),
                "label": container.attrib.get("label", ""),
                "text": get_text(container),
            }
        )

    repository = root.find(".//ead:repository/ead:corpname", NS)
    eadheader = root.find(".//ead:eadheader", NS)
    creation = root.find(".//ead:creation", NS)
    langusage = root.find(".//ead:langusage", NS)

    fallback_id = xml_path.stem.replace("__ead", "").replace("_", ".")
    unit_id = normalize_unit_id(unitid.text if unitid is not None else None, fallback_id)

    return {
        "unit_id": unit_id,
        "title": get_text(unittitle),
        "date_inclusive": get_text(unitdate),
        "date_normal": unitdate.attrib.get("normal", "") if unitdate is not None else "",
        "date_type": unitdate.attrib.get("type", "") if unitdate is not None else "",
        "extent": get_text(extent),
        "carrier": get_text(carrier),
        "abstract": get_text(abstract),
        "scope_content": get_text(scopecontent),
        "biographical_historical": get_text(bioghist),
        "languages": languages,
        "containers": containers,
        "repository": get_text(repository),
        "finding_aid_status": eadheader.attrib.get("findaidstatus", "") if eadheader is not None else "",
        "creation_date": get_text(creation),
        "language_usage": get_text(langusage),
        "file_path": str(xml_path),
    }


def insert_missing_collections(missing, metadata_lookup, existing_unit_ids):
    if not missing:
        print("No missing collections to insert.")
        return

    session = SessionLocal()
    inserted = 0
    inserted_unit_ids = set()
    try:
        for item in missing:
            unit_id = item["unit_id"]
            if unit_id in existing_unit_ids or unit_id in inserted_unit_ids:
                continue

            metadata = metadata_lookup.get(unit_id)
            if not metadata:
                continue

            collection = ArchiveCollection(
                unit_id=metadata["unit_id"],
                title=metadata["title"] or metadata["unit_id"],
                date_inclusive=metadata["date_inclusive"],
                date_normal=metadata["date_normal"],
                date_type=metadata["date_type"],
                extent=metadata["extent"],
                carrier=metadata["carrier"],
                abstract=metadata["abstract"],
                scope_content=metadata["scope_content"],
                biographical_historical=metadata["biographical_historical"],
                languages=metadata["languages"],
                containers=metadata["containers"],
                digital_objects=[],
                repository=metadata["repository"],
                finding_aid_status=metadata["finding_aid_status"],
                creation_date=metadata["creation_date"],
                language_usage=metadata["language_usage"],
                file_path=metadata["file_path"],
                parsed_at=datetime.now(timezone.utc),
            )
            session.add(collection)
            inserted += 1
            inserted_unit_ids.add(unit_id)

        session.commit()
        print(f"Inserted {inserted} missing archive collections.")
    except Exception as exc:  # pylint: disable=broad-except
        session.rollback()
        raise SystemExit(f"Failed to insert missing collections: {exc}") from exc
    finally:
        session.close()


def main():
    parser = argparse.ArgumentParser(description="Verify ArchiveFiles coverage.")
    parser.add_argument("--create-missing", action="store_true", help="Insert missing collections into the database.")
    args = parser.parse_args()

    if not ARCHIVE_DIR.exists():
        raise SystemExit(f"Archive directory not found: {ARCHIVE_DIR}")
    if not DB_PATH.exists():
        raise SystemExit(f"Database not found: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    db_unit_ids = {
        (row[0] or "").strip(): row[1]
        for row in conn.execute("SELECT unit_id, title FROM archive_collections")
        if row[0]
    }
    conn.close()

    xml_files = sorted(ARCHIVE_DIR.glob("*.xml"))
    missing_collections = []
    parse_errors = []
    seen_unit_ids = set()
    metadata_lookup = {}

    for xml_path in xml_files:
        try:
            metadata = extract_collection_metadata(xml_path)
            if not metadata:
                parse_errors.append({"file": xml_path.name, "error": "No archdesc found"})
                continue

            unit_id = metadata["unit_id"]
            metadata_lookup[unit_id] = metadata
            seen_unit_ids.add(unit_id)

            if unit_id not in db_unit_ids:
                missing_collections.append(
                    {"file": xml_path.name, "unit_id": unit_id, "title": metadata["title"]}
                )
        except Exception as exc:  # pylint: disable=broad-except
            parse_errors.append({"file": xml_path.name, "error": str(exc)})

    db_only = sorted(set(db_unit_ids.keys()) - seen_unit_ids)

    if args.create_missing:
        insert_missing_collections(missing_collections, metadata_lookup, set(db_unit_ids.keys()))

    report = {
        "total_files": len(xml_files),
        "parsed_unit_ids": len(seen_unit_ids),
        "missing_in_database": missing_collections,
        "parse_errors": parse_errors,
        "db_entries_without_xml": db_only,
    }

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
