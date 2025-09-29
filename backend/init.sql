-- Database initialization script for Akkasah Archive
-- This script runs when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist (already handled by POSTGRES_DB)
-- CREATE DATABASE IF NOT EXISTS akkasah_archive;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for better performance (will be created by SQLAlchemy migrations)
-- These are just examples - actual indexes will be created by Alembic

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE akkasah_archive TO akkasah_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO akkasah_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO akkasah_user;
