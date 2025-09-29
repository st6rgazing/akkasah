"""
Import script for ArchiveFiles EAD XML data
Parses all EAD files and imports them into the database
"""

import os
import sys
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session
from database import get_db, engine, Base
from ead_parser import EADParser
from models import ArchiveCollection, ArchiveSeries, ArchiveFile

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

def import_archive_data(archive_files_path: str):
    """Import all EAD files from the ArchiveFiles directory"""
    print(f"Starting import from: {archive_files_path}")
    
    # Initialize parser
    parser = EADParser()
    
    # Parse all files in the directory
    parsed_data = parser.parse_directory(archive_files_path)
    
    if not parsed_data:
        print("No data to import!")
        return
    
    print(f"Successfully parsed {len(parsed_data)} files")
    
    # Get database session
    db = next(get_db())
    
    try:
        # Clear existing data (optional - remove if you want to keep existing data)
        print("Clearing existing archive data...")
        db.query(ArchiveFile).delete()
        db.query(ArchiveSeries).delete()
        db.query(ArchiveCollection).delete()
        db.commit()
        
        # Track processed unit_ids to avoid duplicates
        processed_unit_ids = set()
        
        imported_collections = 0
        imported_series = 0
        imported_files = 0
        
        for data in parsed_data:
            if not data:
                continue
                
            collection_data = data.get('collection', {})
            series_data = data.get('series', [])
            admin_data = data.get('administrative', {})
            
            # Skip if unit_id already processed
            unit_id = collection_data.get('unit_id', '')
            if unit_id in processed_unit_ids:
                print(f"Skipping duplicate unit_id: {unit_id}")
                continue
            
            processed_unit_ids.add(unit_id)
            
            # Create ArchiveCollection
            archive_collection = ArchiveCollection(
                unit_id=collection_data.get('unit_id', ''),
                title=collection_data.get('title', ''),
                date_inclusive=collection_data.get('date_inclusive', ''),
                date_normal=collection_data.get('date_normal', ''),
                date_type=collection_data.get('date_type', ''),
                extent=collection_data.get('extent', ''),
                carrier=collection_data.get('carrier', ''),
                abstract=collection_data.get('abstract', ''),
                scope_content=collection_data.get('scope_content', ''),
                biographical_historical=collection_data.get('biographical_historical', ''),
                languages=collection_data.get('languages', []),
                containers=collection_data.get('containers', []),
                digital_objects=collection_data.get('digital_objects', []),
                repository=admin_data.get('repository', ''),
                finding_aid_status=admin_data.get('finding_aid_status', ''),
                creation_date=admin_data.get('creation_date', ''),
                language_usage=admin_data.get('language_usage', ''),
                file_path=data.get('file_path', ''),
                parsed_at=datetime.now() if data.get('parsed_at') else None
            )
            
            db.add(archive_collection)
            db.flush()  # Get the ID
            imported_collections += 1
            
            # Create ArchiveSeries
            for series_info in series_data:
                archive_series = ArchiveSeries(
                    collection_id=archive_collection.id,
                    title=series_info.get('title', ''),
                    unit_id=series_info.get('unit_id', ''),
                    date_inclusive=series_info.get('date_inclusive', ''),
                    level=series_info.get('level', 'series'),
                    digital_objects=series_info.get('digital_objects', [])
                )
                
                db.add(archive_series)
                db.flush()  # Get the ID
                imported_series += 1
                
                # Create ArchiveFiles
                for file_info in series_info.get('files', []):
                    archive_file = ArchiveFile(
                        series_id=archive_series.id,
                        title=file_info.get('title', ''),
                        unit_id=file_info.get('unit_id', ''),
                        date_creation=file_info.get('date_creation', ''),
                        extent=file_info.get('extent', ''),
                        dimensions=file_info.get('dimensions', ''),
                        languages=file_info.get('languages', []),
                        containers=file_info.get('containers', []),
                        digital_objects=file_info.get('digital_objects', []),
                        level=file_info.get('level', 'file')
                    )
                    
                    db.add(archive_file)
                    imported_files += 1
            
            # Commit after each collection to avoid memory issues
            db.commit()
            print(f"Imported collection: {collection_data.get('title', 'Unknown')} ({collection_data.get('unit_id', 'No ID')})")
        
        print(f"\nImport completed successfully!")
        print(f"Collections imported: {imported_collections}")
        print(f"Series imported: {imported_series}")
        print(f"Files imported: {imported_files}")
        
    except Exception as e:
        print(f"Error during import: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

def main():
    """Main function to run the import"""
    # Path to ArchiveFiles directory
    archive_files_path = "/Users/mariam/akkasah/ArchiveFiles"
    
    if not os.path.exists(archive_files_path):
        print(f"ArchiveFiles directory not found: {archive_files_path}")
        print("Please make sure the ArchiveFiles directory exists and contains EAD XML files.")
        return
    
    # Create tables
    create_tables()
    
    # Import data
    import_archive_data(archive_files_path)

if __name__ == "__main__":
    main()
