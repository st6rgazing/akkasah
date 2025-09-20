#!/usr/bin/env python3
"""
Seed script to populate the database with sample data
"""

from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Collection, Image
from schemas import CollectionCreate
import random
from datetime import datetime, timedelta

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        return db
    finally:
        pass

def seed_collections():
    """Seed the database with sample collections"""
    db = get_db()
    
    # Sample collections data
    collections_data = [
        {
            "title": "Early Photography in the Holy Lands",
            "description": "A comprehensive collection of 19th-century photographs documenting the Holy Lands, featuring early landscape photography and architectural documentation from Palestine, Syria, and Lebanon. This collection represents some of the earliest photographic documentation of the region, capturing the landscape and architecture during a period of significant change and development.",
            "historical_context": "This collection represents some of the earliest photographic documentation of the Holy Lands, capturing the region during a period of significant change and development. The photographs document the transition from traditional Ottoman rule to modern administrative structures.",
            "image_count": 1250,
            "period": "1850-1900",
            "collection_type": "Landscape Photography",
            "type": "Historical",
            "is_public": True
        },
        {
            "title": "Ottoman Empire Portraits",
            "description": "Studio portraits and family photographs from the Ottoman period, showcasing the diverse communities and social structures of the empire through intimate photographic documentation. These portraits provide insight into the social fabric of the Ottoman Empire.",
            "historical_context": "These portraits provide insight into the social fabric of the Ottoman Empire, featuring individuals from various ethnic and religious backgrounds. The collection documents the multicultural nature of Ottoman society and the role of photography in identity formation.",
            "image_count": 890,
            "period": "1870-1920",
            "collection_type": "Portrait Photography",
            "type": "Historical",
            "is_public": True
        },
        {
            "title": "Egyptian Cinema Archive",
            "description": "Behind-the-scenes photographs from the golden age of Egyptian cinema, documenting the production process, actors, and cultural impact of film in the region. This collection captures the vibrant film industry of mid-20th century Egypt.",
            "historical_context": "This collection captures the vibrant film industry of mid-20th century Egypt, showcasing the cultural and artistic achievements of the period. The photographs document the golden age of Egyptian cinema and its influence on Arab culture.",
            "image_count": 2100,
            "period": "1940-1970",
            "collection_type": "Documentary Photography",
            "type": "Contemporary",
            "is_public": True
        },
        {
            "title": "Family Albums Collection",
            "description": "Digitized family photographic albums from across the Middle East and North Africa, preserving personal histories and cultural traditions. These family albums offer intimate glimpses into daily life and celebrations.",
            "historical_context": "These family albums offer intimate glimpses into daily life, celebrations, and personal histories across different communities in the region. They document the evolution of family photography and its role in preserving cultural memory.",
            "image_count": 3400,
            "period": "1900-2000",
            "collection_type": "Family Archives",
            "type": "Photo Albums",
            "is_public": True
        },
        {
            "title": "Urban Development in the Gulf",
            "description": "Contemporary documentary photography documenting the rapid urbanization and development of Gulf cities from the 1960s to present. This collection documents the transformation of Gulf cities and the preservation of cultural heritage.",
            "historical_context": "This collection documents the transformation of Gulf cities, capturing both the rapid development and the preservation of cultural heritage. The photographs show the dramatic changes in urban landscapes and social structures.",
            "image_count": 1800,
            "period": "1960-Present",
            "collection_type": "Documentary Photography",
            "type": "Contemporary",
            "is_public": True
        },
        {
            "title": "Berber Cultural Heritage",
            "description": "Photographic documentation of Berber communities across North Africa, preserving traditional practices, crafts, and cultural expressions. This collection focuses on the preservation of Berber cultural practices and traditions.",
            "historical_context": "This collection focuses on the preservation of Berber cultural practices and traditions through photographic documentation. It captures the rich cultural heritage of Berber communities across North Africa.",
            "image_count": 950,
            "period": "1920-1980",
            "collection_type": "Ethnographic Photography",
            "type": "Historical",
            "is_public": True
        },
        {
            "title": "Palestinian Refugee Camps",
            "description": "Documentary photography of Palestinian refugee camps across the Middle East, documenting daily life, community organization, and the struggle for identity and rights.",
            "historical_context": "This collection documents the Palestinian refugee experience across different countries in the Middle East, capturing the resilience and community life in refugee camps.",
            "image_count": 1200,
            "period": "1950-2000",
            "collection_type": "Documentary Photography",
            "type": "Contemporary",
            "is_public": True
        },
        {
            "title": "Islamic Architecture in North Africa",
            "description": "Architectural photography documenting Islamic monuments, mosques, and traditional buildings across North Africa, showcasing the evolution of Islamic architectural styles.",
            "historical_context": "This collection documents the rich architectural heritage of Islamic North Africa, from early mosques to elaborate palaces and traditional dwellings.",
            "image_count": 800,
            "period": "1880-1950",
            "collection_type": "Architectural Photography",
            "type": "Historical",
            "is_public": True
        },
        {
            "title": "Women in the Middle East",
            "description": "Portraits and documentary photographs of women across the Middle East and North Africa, documenting their roles in society, work, and cultural life.",
            "historical_context": "This collection documents the changing roles and representations of women in Middle Eastern and North African societies through photography.",
            "image_count": 1500,
            "period": "1900-1980",
            "collection_type": "Portrait Photography",
            "type": "Historical",
            "is_public": True
        },
        {
            "title": "Contemporary Arab Photography",
            "description": "Contemporary photographic works by Arab artists exploring themes of identity, memory, and social change in the modern Middle East and North Africa.",
            "historical_context": "This collection showcases contemporary Arab photographers and their exploration of modern themes, identity, and social change in the region.",
            "image_count": 600,
            "period": "2000-Present",
            "collection_type": "Contemporary Art",
            "type": "Contemporary",
            "is_public": True
        }
    ]
    
    # Clear existing data
    db.query(Image).delete()
    db.query(Collection).delete()
    db.commit()
    
    # Add collections
    for collection_data in collections_data:
        collection = Collection(**collection_data)
        db.add(collection)
    
    db.commit()
    print(f"Added {len(collections_data)} collections to the database")
    
    # Add some sample images for each collection
    collections = db.query(Collection).all()
    for collection in collections:
        # Add 5-15 sample images per collection
        num_images = random.randint(5, 15)
        for i in range(num_images):
            image = Image(
                collection_id=collection.id,
                title=f"Image {i+1} from {collection.title}",
                description=f"Sample image {i+1} from the {collection.title} collection",
                filename=f"sample_image_{collection.id}_{i+1}.jpg",
                file_path=f"/images/collections/{collection.id}/sample_image_{i+1}.jpg",
                file_size=random.randint(500000, 5000000),  # 500KB to 5MB
                width=random.choice([800, 1200, 1600, 2400]),
                height=random.choice([600, 900, 1200, 1800]),
                format="jpg",
                date_taken=datetime.now() - timedelta(days=random.randint(1, 3650)),
                location=random.choice([
                    "Jerusalem", "Cairo", "Istanbul", "Beirut", "Damascus", 
                    "Baghdad", "Tunis", "Algiers", "Rabat", "Amman"
                ]),
                photographer=random.choice([
                    "Unknown", "Studio Photographer", "Amateur Photographer",
                    "Professional Photographer", "Travel Photographer"
                ]),
                keywords="sample, photography, archive, historical",
                is_public=True
            )
            db.add(image)
    
    db.commit()
    print(f"Added sample images to all collections")
    
    db.close()

def main():
    """Main function to run the seeding process"""
    print("Starting database seeding...")
    seed_collections()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    main()
