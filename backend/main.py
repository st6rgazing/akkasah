from fastapi import FastAPI, HTTPException, Depends, Query, Request, Response, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, RedirectResponse
import os
import hashlib
from urllib.parse import urlparse
import re
import json
import requests
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
import time
import logging
from contextlib import asynccontextmanager

from database import get_db, engine, Base
from models import Collection, Image, ArchiveCollection, ArchiveSeries, ArchiveFile
from schemas import (
    CollectionResponse, CollectionCreate, SearchRequest, SearchResponse,
    ArchiveCollectionResponse, ArchiveCollectionDetail, ArchiveSeriesResponse, 
    ArchiveSeriesDetail, ArchiveFileResponse
)
from services import CollectionService, SearchService
from security import (
    SecurityConfig, check_rate_limit, get_client_ip, 
    add_security_headers, validate_input, validate_file_upload
)

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
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3003", "http://127.0.0.1:3003", "http://localhost:5173", "http://127.0.0.1:5173"],
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

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    client_ip = get_client_ip(request)
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        f"{client_ip} - {request.method} {request.url.path} - "
        f"Status: {response.status_code} - Time: {process_time:.4f}s"
    )
    
    return response

# Initialize services
collection_service = CollectionService()
search_service = SearchService()

# Serve local static files (downloaded images)
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

def _hash_href(href: str) -> str:
    return hashlib.sha1(href.encode("utf-8")).hexdigest()

def _ext_from_href(href: str) -> str:
    path = urlparse(href).path
    ext = os.path.splitext(path)[1].lower() or ".jpg"
    # Normalize common extensions
    if ext in [".jpeg", ".jpg", ".png", ".webp", ".tif", ".tiff"]:
        return ext if ext != ".jpeg" else ".jpg"
    return ".jpg"

@app.get("/api/image")
async def get_image(href: str):
    """Return local static image if present; otherwise redirect to remote href.
    Frontend can use /api/image?href=<encoded original url> as src.
    """
    try:
        file_hash = _hash_href(href)
        ext = _ext_from_href(href)
        local_path = os.path.join(static_dir, "images", f"{file_hash}{ext}")
        if os.path.exists(local_path):
            # Serve from mounted static
            return RedirectResponse(url=f"/static/images/{file_hash}{ext}")
        # Fallback to remote
        return RedirectResponse(url=href)
    except Exception:
        return RedirectResponse(url=href)

@app.get("/api/resolve-image")
async def resolve_image(href: str, max_width: int = 800):
    """Resolve a Handle/viewer URL to a direct image URL (IIIF when available).
    Uses the same logic as EAD parser to extract IIIF manifest from div.dlts_image_map.
    Returns JSON with the resolved URL or redirects to it.
    """
    try:
        from bs4 import BeautifulSoup
        
        size_segment = (
            "full"
            if max_width is None or max_width <= 0
            else f"!{max_width},{max_width}"
        )
        
        # 1) Follow redirects from handle to viewer
        resp = requests.get(href, timeout=10, allow_redirects=True)
        final_url = resp.url
        html = resp.text
        soup = BeautifulSoup(html, 'html.parser')
        
        # 2) Find div.dlts_image_map and extract data-manifest (same as EAD parser)
        image_map_div = soup.find('div', class_='dlts_image_map')
        if not image_map_div:
            # Try alternative selectors
            image_map_div = soup.find('div', {'class': re.compile(r'dlts_image_map', re.I)})
        if not image_map_div:
            # Try by id
            image_map_div = soup.find('div', id=re.compile(r'image', re.I))
        
        if image_map_div:
            data_manifest = image_map_div.get('data-manifest')
            if data_manifest:
                try:
                    # Fetch the IIIF manifest to get the actual service URL (same logic as EAD parser)
                    manifest_response = requests.get(data_manifest, timeout=10)
                    if manifest_response.status_code == 200:
                        manifest_data = manifest_response.json()
                        # Extract the @id which is the IIIF service base URL
                        # Note: In some IIIF implementations, @id might be the manifest URL itself
                        # but for NYU's setup, it appears to be the service base URL
                        iiif_service_url = manifest_data.get('@id')
                        if iiif_service_url:
                            # Construct IIIF URL for thumbnail (same format as EAD parser)
                            iiif_url = f"{iiif_service_url}/full/{size_segment}/0/default.jpg"
                            return RedirectResponse(url=iiif_url, status_code=307)
                        else:
                            # Try to extract service URL from resource structure (Presentation API v2)
                            try:
                                sequences = manifest_data.get('sequences', [])
                                if sequences:
                                    canvases = sequences[0].get('canvases', [])
                                    if canvases:
                                        images = canvases[0].get('images', [])
                                        if images:
                                            resource = images[0].get('resource', {})
                                            service = resource.get('service', {})
                                            service_id = service.get('@id') or service.get('id')
                                            if service_id:
                                                iiif_url = f"{service_id}/full/{size_segment}/0/default.jpg"
                                                return RedirectResponse(url=iiif_url, status_code=307)
                            except Exception:
                                pass
                except Exception as e:
                    logger.error(f"Error fetching IIIF manifest: {str(e)}")
            
            # Fallback: Try data-uri if data-manifest didn't work
            data_uri = image_map_div.get('data-uri')
            if data_uri:
                # If it's a JP2, try to construct IIIF URL
                if data_uri.lower().endswith('.jp2'):
                    iiif_base = data_uri.rsplit('.jp2', 1)[0]
                    iiif_url = f"{iiif_base}/full/{size_segment}/0/default.jpg"
                    return RedirectResponse(url=iiif_url, status_code=307)
                else:
                    # Use data-uri directly
                    return RedirectResponse(url=data_uri, status_code=307)
        
        # 3) Fallback: Try to find manifest URL in HTML using regex
        manifest_url = None
        candidates = re.findall(r'https?://[^"\']+manifest[^"\']+\.json', html, flags=re.IGNORECASE)
        if candidates:
            manifest_url = candidates[0]
        else:
            candidates = re.findall(r'https?://[^"\']+iiif[^"\']+manifest[^"\']+\.json', html, flags=re.IGNORECASE)
            if candidates:
                manifest_url = candidates[0]

        if manifest_url:
            try:
                m = requests.get(manifest_url, timeout=10)
                m.raise_for_status()
                data = m.json()
                # Extract @id from manifest
                iiif_service_url = data.get('@id')
                if iiif_service_url:
                    iiif_url = f"{iiif_service_url}/full/{size_segment}/0/default.jpg"
                    return RedirectResponse(url=iiif_url)
            except Exception as e:
                logger.error(f"Error processing manifest: {str(e)}")

        # 4) Fallback: Try to find direct image in HTML
        direct_candidates = re.findall(r'https?://[^"\']+\.(?:jpg|jpeg|png|webp|tif|tiff)(?:\?[^"\']*)?', html, flags=re.IGNORECASE)
        if direct_candidates:
            return RedirectResponse(url=direct_candidates[0], status_code=307)

        # 5) Last resort: Return thumbnail mode URL
        fallback_url = href if '?urlappend=/mode/thumb' in href else f"{href}?urlappend=/mode/thumb"
        return RedirectResponse(url=fallback_url, status_code=307)
    except Exception as e:
        logger.error(f"Error resolving image {href}: {str(e)}")
        # Fallback to thumbnail mode
        fallback_url = href if '?urlappend=/mode/thumb' in href else f"{href}?urlappend=/mode/thumb"
        return RedirectResponse(url=fallback_url, status_code=307)

@app.get("/api/")
async def root():
    return {"message": "Akkasah Archive API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# Collection endpoints
@app.get("/api/collections", response_model=List[CollectionResponse])
async def get_collections(
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(100, ge=1, le=1000),
    collection_type: Optional[str] = Query(None, max_length=100),
    period: Optional[str] = Query(None, max_length=100),
    db: Session = Depends(get_db)
):
    """Get all collections with optional filtering"""
    try:
        # Validate and sanitize inputs
        if collection_type:
            collection_type = validate_input(collection_type, "collection_type")
        if period:
            period = validate_input(period, "period")
        
        collections = collection_service.get_collections(
            db, skip=skip, limit=limit, 
            collection_type=collection_type, 
            period=period
        )
        return collections
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting collections: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/collections/{collection_id}", response_model=CollectionResponse)
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
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/collections", response_model=CollectionResponse)
async def create_collection(
    collection: CollectionCreate,
    db: Session = Depends(get_db)
):
    """Create a new collection"""
    try:
        new_collection = collection_service.create_collection(db, collection)
        return new_collection
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/collections/search", response_model=List[CollectionResponse])
async def search_collections(
    q: str = Query(..., min_length=1, max_length=500),
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Search collections by query string"""
    try:
        # Validate and sanitize search query
        q = validate_input(q, "search query")
        
        results = search_service.search_collections(db, q, skip=skip, limit=limit)
        return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching collections: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Search endpoints
@app.post("/api/search", response_model=SearchResponse)
async def search_archive(
    search_request: SearchRequest,
    db: Session = Depends(get_db)
):
    """Advanced search across the archive"""
    try:
        results = search_service.advanced_search(db, search_request)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search/suggestions")
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
        raise HTTPException(status_code=500, detail=str(e))

# Statistics endpoints
@app.get("/api/stats")
async def get_archive_stats(db: Session = Depends(get_db)):
    """Get archive statistics"""
    try:
        stats = collection_service.get_archive_stats(db)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Archive Collections endpoints
@app.get("/api/archive/collections", response_model=List[ArchiveCollectionResponse])
async def get_archive_collections(
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(100, ge=1, le=1000),
    unit_id: Optional[str] = Query(None, max_length=50),
    title_search: Optional[str] = Query(None, max_length=255),
    db: Session = Depends(get_db)
):
    """Get all archive collections with optional filtering"""
    try:
        query = db.query(ArchiveCollection).filter(ArchiveCollection.is_public == True)
        
        if unit_id:
            query = query.filter(ArchiveCollection.unit_id.ilike(f"%{unit_id}%"))
        
        if title_search:
            query = query.filter(ArchiveCollection.title.ilike(f"%{title_search}%"))
        
        # Get total count for pagination
        total_count = query.count()
        
        # Order by collections with digital objects first, then by id
        from sqlalchemy import case, func
        collections = query.order_by(
            case(
                (func.length(ArchiveCollection.digital_objects) > 2, 1),  # More than just "[]"
                else_=0
            ).desc(),
            ArchiveCollection.id
        ).offset(skip).limit(limit).all()
        
        # For each collection, get files with digital objects (limit for performance)
        for collection in collections:
            files = db.query(ArchiveFile).join(ArchiveSeries).filter(
                ArchiveSeries.collection_id == collection.id,
                ArchiveFile.digital_objects.isnot(None)
            ).limit(20).all()  # Limit to first 20 files with images
            
            # Convert files to dictionaries
            files_dict = []
            for file in files:
                file_dict = {
                    'id': file.id,
                    'title': file.title,
                    'unit_id': file.unit_id,
                    'date_creation': file.date_creation,
                    'extent': file.extent,
                    'dimensions': file.dimensions,
                    'languages': file.languages,
                    'containers': file.containers,
                    'digital_objects': file.digital_objects,
                    'level': file.level,
                    'created_at': file.created_at,
                    'updated_at': file.updated_at
                }
                files_dict.append(file_dict)
            
            collection.files = files_dict
        
        return collections
    except Exception as e:
        logger.error(f"Error getting archive collections: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/archive/collections/{collection_id}", response_model=ArchiveCollectionDetail)
async def get_archive_collection(
    collection_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Get a specific archive collection with its series"""
    try:
        collection = db.query(ArchiveCollection).filter(
            ArchiveCollection.id == collection_id,
            ArchiveCollection.is_public == True
        ).first()
        
        if not collection:
            raise HTTPException(status_code=404, detail="Archive collection not found")
        
        # Get series for this collection
        series = db.query(ArchiveSeries).filter(
            ArchiveSeries.collection_id == collection_id
        ).all()
        
        collection.series = series
        
        # Process images in background if needed (check if any image-service URLs don't have full_image)
        needs_processing = False
        if collection.digital_objects:
            for obj in collection.digital_objects:
                if obj.get('role', '').lower() == 'image-service' and obj.get('href'):
                    if not obj.get('full_image') or obj.get('full_image') == obj.get('href'):
                        needs_processing = True
                        break
        
        # Process images in background if needed
        if needs_processing:
            from ead_parser import EADParser
            parser = EADParser()
            
            def process_images():
                try:
                    db_session = next(get_db())
                    coll = db_session.query(ArchiveCollection).filter(
                        ArchiveCollection.id == collection_id
                    ).first()
                    if coll and coll.digital_objects:
                        updated = False
                        for obj in coll.digital_objects:
                            if obj.get('role', '').lower() == 'image-service' and obj.get('href'):
                                if not obj.get('full_image') or obj.get('full_image') == obj.get('href'):
                                    result = parser._process_image_service_url(obj['href'], coll.title or '')
                                    obj.update({
                                        'image_id': result.get('image_id'),
                                        'full_image': result.get('full_image'),
                                        'thumbnail': result.get('thumbnail'),
                                        'back_image_id': result.get('back_image_id')
                                    })
                                    updated = True
                        if updated:
                            coll.digital_objects = coll.digital_objects
                            db_session.commit()
                    db_session.close()
                except Exception as e:
                    logger.error(f"Error processing images in background: {str(e)}")
            
            background_tasks.add_task(process_images)
        
        return collection
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting archive collection: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/archive/collections/{collection_id}/series", response_model=List[ArchiveSeriesResponse])
async def get_archive_series(
    collection_id: int,
    db: Session = Depends(get_db)
):
    """Get all series for a specific archive collection"""
    try:
        # Check if collection exists
        collection = db.query(ArchiveCollection).filter(
            ArchiveCollection.id == collection_id,
            ArchiveCollection.is_public == True
        ).first()
        
        if not collection:
            raise HTTPException(status_code=404, detail="Archive collection not found")
        
        series = db.query(ArchiveSeries).filter(
            ArchiveSeries.collection_id == collection_id
        ).all()
        
        return series
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting archive series: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/archive/series/{series_id}", response_model=ArchiveSeriesDetail)
async def get_archive_series_detail(
    series_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific series with its files"""
    try:
        series = db.query(ArchiveSeries).filter(ArchiveSeries.id == series_id).first()
        
        if not series:
            raise HTTPException(status_code=404, detail="Archive series not found")
        
        # Get files for this series
        files = db.query(ArchiveFile).filter(ArchiveFile.series_id == series_id).all()
        
        series.files = files
        return series
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting archive series: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/archive/search")
async def search_archive(
    q: str = Query(..., min_length=1, max_length=255),
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(50, ge=1, le=1000),
    search_type: str = Query("all", regex="^(all|collections|series|files)$"),
    date_from: Optional[str] = Query(None, max_length=10),
    date_to: Optional[str] = Query(None, max_length=10),
    language: Optional[str] = Query(None, max_length=10),
    sort_by: str = Query("relevance", regex="^(relevance|title|date|created)$"),
    sort_order: str = Query("asc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """Advanced search across archive collections, series, and files"""
    try:
        from sqlalchemy import func, or_, and_
        
        search_term = f"%{q}%"
        results = {"query": q, "collections": [], "series": [], "files": [], "total_results": 0}
        
        # Build date filter
        date_filter = None
        if date_from or date_to:
            date_conditions = []
            if date_from:
                date_conditions.append(ArchiveCollection.date_normal >= date_from)
            if date_to:
                date_conditions.append(ArchiveCollection.date_normal <= date_to)
            date_filter = and_(*date_conditions)
        
        # Search collections
        if search_type in ["all", "collections"]:
            collection_query = db.query(ArchiveCollection).filter(
                ArchiveCollection.is_public == True,
                or_(
                    ArchiveCollection.title.ilike(search_term),
                    ArchiveCollection.abstract.ilike(search_term),
                    ArchiveCollection.scope_content.ilike(search_term),
                    ArchiveCollection.biographical_historical.ilike(search_term)
                )
            )
            
            if date_filter:
                collection_query = collection_query.filter(date_filter)
            
            if language:
                collection_query = collection_query.filter(
                    ArchiveCollection.languages.contains([{"text": language}])
                )
            
            # Apply sorting
            if sort_by == "title":
                order_col = ArchiveCollection.title
            elif sort_by == "date":
                order_col = ArchiveCollection.date_normal
            elif sort_by == "created":
                order_col = ArchiveCollection.created_at
            else:  # relevance
                order_col = ArchiveCollection.title  # Simple relevance by title match
            
            if sort_order == "desc":
                order_col = order_col.desc()
            
            collections = collection_query.order_by(order_col).offset(skip).limit(limit).all()
            results["collections"] = collections
        
        # Search series
        if search_type in ["all", "series"]:
            series_query = db.query(ArchiveSeries).join(ArchiveCollection).filter(
                ArchiveCollection.is_public == True,
                or_(
                    ArchiveSeries.title.ilike(search_term),
                    ArchiveSeries.unit_id.ilike(search_term)
                )
            )
            
            if date_filter:
                series_query = series_query.filter(date_filter)
            
            if sort_by == "title":
                order_col = ArchiveSeries.title
            elif sort_by == "date":
                order_col = ArchiveSeries.date_inclusive
            elif sort_by == "created":
                order_col = ArchiveSeries.created_at
            else:
                order_col = ArchiveSeries.title
            
            if sort_order == "desc":
                order_col = order_col.desc()
            
            series = series_query.order_by(order_col).offset(skip).limit(limit).all()
            results["series"] = series
        
        # Search files
        if search_type in ["all", "files"]:
            files_query = db.query(ArchiveFile).join(ArchiveSeries).join(ArchiveCollection).filter(
                ArchiveCollection.is_public == True,
                or_(
                    ArchiveFile.title.ilike(search_term),
                    ArchiveFile.unit_id.ilike(search_term)
                )
            )
            
            if date_filter:
                files_query = files_query.filter(date_filter)
            
            if language:
                files_query = files_query.filter(
                    ArchiveFile.languages.contains([{"text": language}])
                )
            
            if sort_by == "title":
                order_col = ArchiveFile.title
            elif sort_by == "date":
                order_col = ArchiveFile.date_creation
            elif sort_by == "created":
                order_col = ArchiveFile.created_at
            else:
                order_col = ArchiveFile.title
            
            if sort_order == "desc":
                order_col = order_col.desc()
            
            files = files_query.order_by(order_col).offset(skip).limit(limit).all()
            results["files"] = files
        
        results["total_results"] = len(results["collections"]) + len(results["series"]) + len(results["files"])
        return results
        
    except Exception as e:
        logger.error(f"Error searching archive: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/archive/stats")
async def get_archive_stats(db: Session = Depends(get_db)):
    """Get archive statistics"""
    try:
        total_collections = db.query(ArchiveCollection).filter(ArchiveCollection.is_public == True).count()
        total_series = db.query(ArchiveSeries).count()
        total_files = db.query(ArchiveFile).count()
        
        # Get collections by finding aid status
        from sqlalchemy import func
        status_counts = db.query(
            ArchiveCollection.finding_aid_status,
            func.count(ArchiveCollection.id).label('count')
        ).filter(ArchiveCollection.is_public == True).group_by(ArchiveCollection.finding_aid_status).all()
        
        return {
            "total_collections": total_collections,
            "total_series": total_series,
            "total_files": total_files,
            "status_counts": {status: count for status, count in status_counts}
        }
    except Exception as e:
        logger.error(f"Error getting archive stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
