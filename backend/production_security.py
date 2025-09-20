"""
Production security configuration for Akkasah Archive
"""

import os
import secrets
from typing import List

class ProductionSecurityConfig:
    """Production security configuration"""
    
    # Generate secure secret key
    SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
    
    # Environment
    ENVIRONMENT = os.getenv("ENVIRONMENT", "production")
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./akkasah_archive.db")
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "https://yourdomain.com").split(",")
    CORS_ALLOW_CREDENTIALS = True
    CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    CORS_ALLOW_HEADERS = ["*"]
    CORS_MAX_AGE = 3600
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
    
    # Security Headers
    SECURITY_HEADERS = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Content-Security-Policy": (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://api.yourdomain.com; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        ),
        "Permissions-Policy": (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "usb=(), "
            "magnetometer=(), "
            "gyroscope=(), "
            "speaker=(), "
            "vibrate=(), "
            "fullscreen=(self), "
            "payment=()"
        )
    }
    
    # File Upload Security
    MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
    ALLOWED_FILE_EXTENSIONS = [
        ".jpg", ".jpeg", ".png", ".gif", ".tiff", ".webp"
    ]
    UPLOAD_DIRECTORY = os.getenv("UPLOAD_DIRECTORY", "./uploads")
    
    # Input Validation
    MAX_STRING_LENGTH = int(os.getenv("MAX_STRING_LENGTH", "1000"))
    MAX_DESCRIPTION_LENGTH = int(os.getenv("MAX_DESCRIPTION_LENGTH", "5000"))
    
    # Authentication
    JWT_ALGORITHM = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    JWT_REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # Session Security
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Strict"
    SESSION_COOKIE_MAX_AGE = 3600  # 1 hour
    
    # Password Security
    PASSWORD_MIN_LENGTH = 12
    PASSWORD_REQUIRE_UPPERCASE = True
    PASSWORD_REQUIRE_LOWERCASE = True
    PASSWORD_REQUIRE_NUMBERS = True
    PASSWORD_REQUIRE_SYMBOLS = True
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE = os.getenv("LOG_FILE", "./logs/akkasah.log")
    LOG_MAX_SIZE = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT = 5
    
    # Monitoring
    SENTRY_DSN = os.getenv("SENTRY_DSN")
    ENABLE_METRICS = os.getenv("ENABLE_METRICS", "True").lower() == "true"
    
    # Backup Security
    BACKUP_ENCRYPTION_KEY = os.getenv("BACKUP_ENCRYPTION_KEY", secrets.token_urlsafe(32))
    BACKUP_RETENTION_DAYS = int(os.getenv("BACKUP_RETENTION_DAYS", "30"))
    
    # API Security
    API_RATE_LIMIT_PER_MINUTE = int(os.getenv("API_RATE_LIMIT_PER_MINUTE", "60"))
    API_RATE_LIMIT_BURST = int(os.getenv("API_RATE_LIMIT_BURST", "10"))
    
    # Cache Security
    CACHE_TTL = int(os.getenv("CACHE_TTL", "3600"))
    CACHE_MAX_SIZE = int(os.getenv("CACHE_MAX_SIZE", "1000"))
    
    @classmethod
    def validate_config(cls) -> List[str]:
        """Validate security configuration"""
        errors = []
        
        # Check secret key
        if len(cls.SECRET_KEY) < 32:
            errors.append("SECRET_KEY must be at least 32 characters long")
        
        # Check CORS origins
        if not cls.CORS_ORIGINS or cls.CORS_ORIGINS == ["https://yourdomain.com"]:
            errors.append("CORS_ORIGINS must be configured with actual domains")
        
        # Check file upload directory
        if not os.path.exists(cls.UPLOAD_DIRECTORY):
            try:
                os.makedirs(cls.UPLOAD_DIRECTORY, exist_ok=True)
            except Exception as e:
                errors.append(f"Cannot create upload directory: {e}")
        
        # Check log directory
        log_dir = os.path.dirname(cls.LOG_FILE)
        if not os.path.exists(log_dir):
            try:
                os.makedirs(log_dir, exist_ok=True)
            except Exception as e:
                errors.append(f"Cannot create log directory: {e}")
        
        return errors
    
    @classmethod
    def get_database_config(cls) -> dict:
        """Get database configuration with security settings"""
        return {
            "url": cls.DATABASE_URL,
            "echo": cls.DEBUG,
            "pool_pre_ping": True,
            "pool_recycle": 3600,
            "pool_size": 10,
            "max_overflow": 20,
        }
    
    @classmethod
    def get_redis_config(cls) -> dict:
        """Get Redis configuration for caching and sessions"""
        return {
            "host": os.getenv("REDIS_HOST", "localhost"),
            "port": int(os.getenv("REDIS_PORT", "6379")),
            "db": int(os.getenv("REDIS_DB", "0")),
            "password": os.getenv("REDIS_PASSWORD"),
            "ssl": os.getenv("REDIS_SSL", "False").lower() == "true",
            "decode_responses": True,
        }

# Security middleware configuration
class SecurityMiddlewareConfig:
    """Configuration for security middleware"""
    
    # Trusted hosts
    TRUSTED_HOSTS = [
        "localhost",
        "127.0.0.1",
        "*.yourdomain.com",
        "yourdomain.com"
    ]
    
    # Rate limiting configuration
    RATE_LIMIT_STORAGE = "memory"  # or "redis"
    RATE_LIMIT_KEY_PREFIX = "rate_limit:"
    
    # Security headers
    HSTS_MAX_AGE = 31536000  # 1 year
    HSTS_INCLUDE_SUBDOMAINS = True
    HSTS_PRELOAD = True
    
    # Content Security Policy
    CSP_REPORT_URI = "/api/security/csp-report"
    CSP_REPORT_ONLY = False
    
    # CORS preflight
    CORS_PREFLIGHT_MAX_AGE = 3600
    
    # Request size limits
    MAX_REQUEST_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_HEADER_SIZE = 8192  # 8KB
    
    # Timeout settings
    REQUEST_TIMEOUT = 30  # seconds
    KEEP_ALIVE_TIMEOUT = 5  # seconds
    
    # Connection limits
    MAX_CONNECTIONS = 1000
    MAX_CONNECTIONS_PER_IP = 10

# Security utilities
class SecurityUtils:
    """Security utility functions"""
    
    @staticmethod
    def generate_secure_token(length: int = 32) -> str:
        """Generate a cryptographically secure token"""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password securely"""
        import bcrypt
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verify a password against its hash"""
        import bcrypt
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize a filename for safe storage"""
        import re
        import os
        
        # Remove directory separators
        filename = os.path.basename(filename)
        
        # Remove dangerous characters
        filename = re.sub(r'[^\w\-_\.]', '', filename)
        
        # Limit length
        name, ext = os.path.splitext(filename)
        if len(name) > 100:
            name = name[:100]
        
        return f"{name}{ext}"
    
    @staticmethod
    def is_safe_url(url: str) -> bool:
        """Check if a URL is safe (no SSRF)"""
        from urllib.parse import urlparse
        
        try:
            parsed = urlparse(url)
            
            # Only allow HTTP and HTTPS
            if parsed.scheme not in ['http', 'https']:
                return False
            
            # Block private IP ranges
            if parsed.hostname:
                # This is a simplified check - in production, use a proper IP validation library
                if parsed.hostname.startswith(('127.', '192.168.', '10.', '172.')):
                    return False
            
            return True
        except:
            return False
