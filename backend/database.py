from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
import os

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./akkasah_archive.db")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Enable FTS (Full Text Search) for SQLite
def enable_fts():
    """Enable Full Text Search for SQLite database"""
    with engine.connect() as conn:
        # Enable FTS5 extension
        conn.execute("PRAGMA compile_options")
        
        # Create FTS virtual tables for search
        conn.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS collections_fts USING fts5(
                title, 
                description, 
                historical_context,
                content='collections',
                content_rowid='id'
            )
        """)
        
        # Create trigger to keep FTS table in sync
        conn.execute("""
            CREATE TRIGGER IF NOT EXISTS collections_fts_insert AFTER INSERT ON collections BEGIN
                INSERT INTO collections_fts(rowid, title, description, historical_context)
                VALUES (new.id, new.title, new.description, new.historical_context);
            END
        """)
        
        conn.execute("""
            CREATE TRIGGER IF NOT EXISTS collections_fts_update AFTER UPDATE ON collections BEGIN
                UPDATE collections_fts SET 
                    title = new.title,
                    description = new.description,
                    historical_context = new.historical_context
                WHERE rowid = new.id;
            END
        """)
        
        conn.execute("""
            CREATE TRIGGER IF NOT EXISTS collections_fts_delete AFTER DELETE ON collections BEGIN
                DELETE FROM collections_fts WHERE rowid = old.id;
            END
        """)
        
        conn.commit()

# Initialize FTS when module is imported
try:
    enable_fts()
except Exception as e:
    print(f"Warning: Could not enable FTS: {e}")
