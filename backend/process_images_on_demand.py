"""
Process images on-demand for a collection
This updates the digital_objects with processed image URLs
"""
import os
from database import get_db
from models import ArchiveCollection, ArchiveSeries, ArchiveFile
from ead_parser import EADParser
import json

def process_collection_images(collection_id: int):
    """Process images for a specific collection"""
    db = next(get_db())
    try:
        collection = db.query(ArchiveCollection).filter(
            ArchiveCollection.id == collection_id
        ).first()
        
        if not collection:
            return False
        
        parser = EADParser()
        updated = False
        
        # Process collection-level digital objects
        if collection.digital_objects:
            for obj in collection.digital_objects:
                if obj.get('role', '').lower() == 'image-service' and obj.get('href'):
                    if not obj.get('full_image') or obj.get('full_image') == obj.get('href'):
                        # Process this image
                        result = parser._process_image_service_url(obj['href'], collection.title or '')
                        obj.update({
                            'image_id': result.get('image_id'),
                            'full_image': result.get('full_image'),
                            'thumbnail': result.get('thumbnail'),
                            'back_image_id': result.get('back_image_id')
                        })
                        updated = True
        
        # Process series digital objects
        series_list = db.query(ArchiveSeries).filter(
            ArchiveSeries.collection_id == collection_id
        ).all()
        
        for series in series_list:
            if series.digital_objects:
                for obj in series.digital_objects:
                    if obj.get('role', '').lower() == 'image-service' and obj.get('href'):
                        if not obj.get('full_image') or obj.get('full_image') == obj.get('href'):
                            result = parser._process_image_service_url(obj['href'], series.title or '')
                            obj.update({
                                'image_id': result.get('image_id'),
                                'full_image': result.get('full_image'),
                                'thumbnail': result.get('thumbnail'),
                                'back_image_id': result.get('back_image_id')
                            })
                            updated = True
                if updated:
                    series.digital_objects = series.digital_objects
        
        # Process file digital objects
        for series in series_list:
            files = db.query(ArchiveFile).filter(
                ArchiveFile.series_id == series.id
            ).all()
            
            for file in files:
                if file.digital_objects:
                    file_updated = False
                    for obj in file.digital_objects:
                        if obj.get('role', '').lower() == 'image-service' and obj.get('href'):
                            if not obj.get('full_image') or obj.get('full_image') == obj.get('href'):
                                result = parser._process_image_service_url(obj['href'], file.title or '')
                                obj.update({
                                    'image_id': result.get('image_id'),
                                    'full_image': result.get('full_image'),
                                    'thumbnail': result.get('thumbnail'),
                                    'back_image_id': result.get('back_image_id')
                                })
                                file_updated = True
                                updated = True
                    if file_updated:
                        file.digital_objects = file.digital_objects
        
        if updated:
            collection.digital_objects = collection.digital_objects
            db.commit()
            return True
        
        return False
        
    except Exception as e:
        print(f"Error processing images for collection {collection_id}: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        collection_id = int(sys.argv[1])
        print(f"Processing images for collection {collection_id}...")
        result = process_collection_images(collection_id)
        print(f"Result: {'Success' if result else 'No updates needed'}")
    else:
        print("Usage: python process_images_on_demand.py <collection_id>")





