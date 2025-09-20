from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Base schemas
class CollectionBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    historical_context: Optional[str] = None
    image_count: int = Field(0, ge=0)
    period: str = Field(..., min_length=1, max_length=100)
    collection_type: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., pattern="^(Historical|Contemporary|Photo Albums|Family Archives)$")
    is_public: bool = True

class CollectionCreate(CollectionBase):
    pass

class CollectionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    historical_context: Optional[str] = None
    image_count: Optional[int] = Field(None, ge=0)
    period: Optional[str] = Field(None, min_length=1, max_length=100)
    collection_type: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[str] = Field(None, pattern="^(Historical|Contemporary|Photo Albums|Family Archives)$")
    is_public: Optional[bool] = None

class CollectionResponse(CollectionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Image schemas
class ImageBase(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    filename: str = Field(..., min_length=1, max_length=255)
    file_path: str = Field(..., min_length=1, max_length=500)
    file_size: Optional[int] = Field(None, ge=0)
    width: Optional[int] = Field(None, ge=0)
    height: Optional[int] = Field(None, ge=0)
    format: Optional[str] = Field(None, max_length=10)
    date_taken: Optional[datetime] = None
    location: Optional[str] = Field(None, max_length=255)
    photographer: Optional[str] = Field(None, max_length=255)
    keywords: Optional[str] = None
    is_public: bool = True

class ImageCreate(ImageBase):
    collection_id: int

class ImageResponse(ImageBase):
    id: int
    collection_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Search schemas
class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    collection_type: Optional[str] = None
    period: Optional[str] = None
    type: Optional[str] = None
    skip: int = Field(0, ge=0)
    limit: int = Field(50, ge=1, le=100)

class SearchResult(BaseModel):
    id: int
    title: str
    description: str
    collection_type: str
    period: str
    type: str
    image_count: int
    relevance_score: Optional[float] = None

class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResult]
    suggestions: Optional[List[str]] = None

# Statistics schemas
class ArchiveStats(BaseModel):
    total_collections: int
    total_images: int
    collections_by_type: dict
    collections_by_period: dict
    recent_collections: List[CollectionResponse]

# Collection detail with images
class CollectionDetail(CollectionResponse):
    images: List[ImageResponse] = []
