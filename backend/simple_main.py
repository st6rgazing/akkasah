from fastapi import FastAPI, HTTPException, Depends, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
import time
import logging
from contextlib import asynccontextmanager

from database import get_db, engine, Base
from models import Collection, Image
from schemas import CollectionResponse, CollectionCreate, SearchRequest, SearchResponse
from services import CollectionService, SearchService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Akkasah Archive API")
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    logger.info("Shutting down Akkasah Archive API")

app = FastAPI(
    title="Akkasah Archive API",
    description="Secure API for the Akkasah Photography Archive",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.yourdomain.com"]
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS middleware with security restrictions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,
)

# Security headers middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    
    # Add security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' https:; "
        "connect-src 'self'"
    )
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    return response

# Initialize services
collection_service = CollectionService()
search_service = SearchService()

@app.get("/")
async def root():
    return {"message": "Akkasah Archive API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Collection endpoints
@app.get("/collections", response_model=List[CollectionResponse])
async def get_collections(
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(100, ge=1, le=1000),
    collection_type: Optional[str] = Query(None, max_length=100),
    period: Optional[str] = Query(None, max_length=100),
    db: Session = Depends(get_db)
):
    """Get all collections with optional filtering"""
    try:
        collections = collection_service.get_collections(
            db, skip=skip, limit=limit, 
            collection_type=collection_type, 
            period=period
        )
        return collections
    except Exception as e:
        logger.error(f"Error getting collections: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/collections/{collection_id}", response_model=CollectionResponse)
async def get_collection(
    collection_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific collection by ID"""
    try:
        collection = collection_service.get_collection_by_id(db, collection_id)
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        return collection
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting collection: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/collections/search", response_model=List[CollectionResponse])
async def search_collections(
    q: str = Query(..., min_length=1, max_length=500),
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Search collections by query string"""
    try:
        results = search_service.search_collections(db, q, skip=skip, limit=limit)
        return results
    except Exception as e:
        logger.error(f"Error searching collections: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Search endpoints
@app.post("/search", response_model=SearchResponse)
async def search_archive(
    search_request: SearchRequest,
    db: Session = Depends(get_db)
):
    """Advanced search across the archive"""
    try:
        results = search_service.advanced_search(db, search_request)
        return results
    except Exception as e:
        logger.error(f"Error in advanced search: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/search/suggestions")
async def get_search_suggestions(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get search suggestions based on query"""
    try:
        suggestions = search_service.get_suggestions(db, q, limit=limit)
        return {"suggestions": suggestions}
    except Exception as e:
        logger.error(f"Error getting suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Statistics endpoints
@app.get("/stats")
async def get_archive_stats(db: Session = Depends(get_db)):
    """Get archive statistics"""
    try:
        stats = collection_service.get_archive_stats(db)
        return stats
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
