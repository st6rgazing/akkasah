from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from typing import List, Optional, Dict, Any
from models import Collection, Image, SearchLog, CollectionStats
from schemas import CollectionCreate, SearchRequest, SearchResult, ArchiveStats
import json
from datetime import datetime

class CollectionService:
    def get_collections(
        self, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        collection_type: Optional[str] = None,
        period: Optional[str] = None
    ) -> List[Collection]:
        """Get collections with optional filtering"""
        query = db.query(Collection).filter(Collection.is_public == True)
        
        if collection_type:
            query = query.filter(Collection.collection_type == collection_type)
        
        if period:
            query = query.filter(Collection.period == period)
        
        return query.offset(skip).limit(limit).all()

    def get_collection_by_id(self, db: Session, collection_id: int) -> Optional[Collection]:
        """Get a specific collection by ID"""
        return db.query(Collection).filter(
            Collection.id == collection_id,
            Collection.is_public == True
        ).first()

    def create_collection(self, db: Session, collection: CollectionCreate) -> Collection:
        """Create a new collection"""
        db_collection = Collection(**collection.dict())
        db.add(db_collection)
        db.commit()
        db.refresh(db_collection)
        return db_collection

    def update_collection(self, db: Session, collection_id: int, collection_update: dict) -> Optional[Collection]:
        """Update a collection"""
        db_collection = db.query(Collection).filter(Collection.id == collection_id).first()
        if not db_collection:
            return None
        
        for field, value in collection_update.items():
            if value is not None:
                setattr(db_collection, field, value)
        
        db.commit()
        db.refresh(db_collection)
        return db_collection

    def delete_collection(self, db: Session, collection_id: int) -> bool:
        """Delete a collection"""
        db_collection = db.query(Collection).filter(Collection.id == collection_id).first()
        if not db_collection:
            return False
        
        db.delete(db_collection)
        db.commit()
        return True

    def get_archive_stats(self, db: Session) -> ArchiveStats:
        """Get archive statistics"""
        total_collections = db.query(Collection).filter(Collection.is_public == True).count()
        total_images = db.query(Image).filter(Image.is_public == True).count()
        
        # Collections by type
        collections_by_type = db.query(
            Collection.type, 
            func.count(Collection.id).label('count')
        ).filter(Collection.is_public == True).group_by(Collection.type).all()
        
        # Collections by period
        collections_by_period = db.query(
            Collection.period,
            func.count(Collection.id).label('count')
        ).filter(Collection.is_public == True).group_by(Collection.period).all()
        
        # Recent collections
        recent_collections = db.query(Collection).filter(
            Collection.is_public == True
        ).order_by(desc(Collection.created_at)).limit(5).all()
        
        return ArchiveStats(
            total_collections=total_collections,
            total_images=total_images,
            collections_by_type={item.type: item.count for item in collections_by_type},
            collections_by_period={item.period: item.count for item in collections_by_period},
            recent_collections=recent_collections
        )

class SearchService:
    def search_collections(self, db: Session, query: str, skip: int = 0, limit: int = 50) -> List[Collection]:
        """Search collections using FTS"""
        try:
            # Sanitize query to prevent SQL injection
            import re
            # Remove potentially dangerous characters
            sanitized_query = re.sub(r'[^\w\s\-_.,!?]', '', query)
            if not sanitized_query.strip():
                return []
            
            # Use FTS5 for full-text search
            fts_query = f"""
                SELECT c.* FROM collections c
                JOIN collections_fts fts ON c.id = fts.rowid
                WHERE collections_fts MATCH ?
                AND c.is_public = 1
                ORDER BY rank
                LIMIT ? OFFSET ?
            """
            
            results = db.execute(fts_query, (sanitized_query, limit, skip)).fetchall()
            collections = []
            
            for row in results:
                collection = db.query(Collection).filter(Collection.id == row[0]).first()
                if collection:
                    collections.append(collection)
            
            return collections
        except Exception as e:
            print(f"FTS search failed, falling back to LIKE search: {e}")
            # Fallback to LIKE search with sanitized query
            sanitized_query = re.sub(r'[^\w\s\-_.,!?]', '', query)
            if not sanitized_query.strip():
                return []
                
            return db.query(Collection).filter(
                and_(
                    Collection.is_public == True,
                    or_(
                        Collection.title.ilike(f"%{sanitized_query}%"),
                        Collection.description.ilike(f"%{sanitized_query}%"),
                        Collection.historical_context.ilike(f"%{sanitized_query}%")
                    )
                )
            ).offset(skip).limit(limit).all()

    def advanced_search(self, db: Session, search_request: SearchRequest) -> Dict[str, Any]:
        """Advanced search with filters"""
        query = db.query(Collection).filter(Collection.is_public == True)
        
        # Text search
        if search_request.query:
            query = query.filter(
                or_(
                    Collection.title.ilike(f"%{search_request.query}%"),
                    Collection.description.ilike(f"%{search_request.query}%"),
                    Collection.historical_context.ilike(f"%{search_request.query}%")
                )
            )
        
        # Filters
        if search_request.collection_type:
            query = query.filter(Collection.collection_type == search_request.collection_type)
        
        if search_request.period:
            query = query.filter(Collection.period == search_request.period)
        
        if search_request.type:
            query = query.filter(Collection.type == search_request.type)
        
        # Get total count
        total_results = query.count()
        
        # Get results
        results = query.offset(search_request.skip).limit(search_request.limit).all()
        
        # Convert to search results
        search_results = []
        for collection in results:
            search_results.append(SearchResult(
                id=collection.id,
                title=collection.title,
                description=collection.description,
                collection_type=collection.collection_type,
                period=collection.period,
                type=collection.type,
                image_count=collection.image_count
            ))
        
        # Log search
        self._log_search(db, search_request, total_results)
        
        return {
            "query": search_request.query,
            "total_results": total_results,
            "results": search_results
        }

    def get_suggestions(self, db: Session, query: str, limit: int = 10) -> List[str]:
        """Get search suggestions based on query"""
        suggestions = []
        
        # Get title suggestions
        title_suggestions = db.query(Collection.title).filter(
            and_(
                Collection.is_public == True,
                Collection.title.ilike(f"%{query}%")
            )
        ).limit(limit // 2).all()
        
        suggestions.extend([s[0] for s in title_suggestions])
        
        # Get collection type suggestions
        type_suggestions = db.query(Collection.collection_type).filter(
            and_(
                Collection.is_public == True,
                Collection.collection_type.ilike(f"%{query}%")
            )
        ).distinct().limit(limit // 2).all()
        
        suggestions.extend([s[0] for s in type_suggestions])
        
        return list(set(suggestions))[:limit]

    def _log_search(self, db: Session, search_request: SearchRequest, results_count: int):
        """Log search query for analytics"""
        try:
            search_log = SearchLog(
                query=search_request.query,
                filters=json.dumps({
                    "collection_type": search_request.collection_type,
                    "period": search_request.period,
                    "type": search_request.type
                }),
                results_count=results_count
            )
            db.add(search_log)
            db.commit()
        except Exception as e:
            print(f"Failed to log search: {e}")
            db.rollback()
