from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    historical_context = Column(Text, nullable=True)
    image_count = Column(Integer, default=0)
    period = Column(String(100), nullable=False, index=True)
    collection_type = Column(String(100), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)  # Historical, Contemporary, Photo Albums
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    images = relationship("Image", back_populates="collection", cascade="all, delete-orphan")

class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collections.id"), nullable=False)
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    format = Column(String(10), nullable=True)  # jpg, png, tiff, etc.
    date_taken = Column(DateTime(timezone=True), nullable=True)
    location = Column(String(255), nullable=True)
    photographer = Column(String(255), nullable=True)
    keywords = Column(Text, nullable=True)  # Comma-separated keywords
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    collection = relationship("Collection", back_populates="images")

class SearchLog(Base):
    __tablename__ = "search_logs"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(String(500), nullable=False)
    filters = Column(Text, nullable=True)  # JSON string of filters
    results_count = Column(Integer, default=0)
    user_ip = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CollectionStats(Base):
    __tablename__ = "collection_stats"

    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collections.id"), nullable=False)
    total_views = Column(Integer, default=0)
    total_downloads = Column(Integer, default=0)
    last_viewed = Column(DateTime(timezone=True), nullable=True)
    last_downloaded = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
