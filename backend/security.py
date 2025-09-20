"""
Security utilities and middleware for the Akkasah Archive API
"""

import secrets
import hashlib
import hmac
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
import re
import os
from urllib.parse import urlparse
from fastapi import Depends

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "your-super-secret-key-change-in-production"  # Should be from environment
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Rate limiting
rate_limit_storage: Dict[str, Dict[str, Any]] = {}

class SecurityConfig:
    """Security configuration settings"""
    
    # CORS settings
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://yourdomain.com"  # Add your production domain
    ]
    
    # Rate limiting
    RATE_LIMIT_REQUESTS = 1000  # requests per minute
    RATE_LIMIT_WINDOW = 60  # seconds
    
    # Input validation
    MAX_STRING_LENGTH = 1000
    MAX_DESCRIPTION_LENGTH = 5000
    ALLOWED_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.tiff', '.webp']
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    # SQL injection patterns
    SQL_INJECTION_PATTERNS = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)",
        r"(\b(OR|AND)\s+\d+\s*=\s*\d+)",
        r"(\b(OR|AND)\s+'.*'\s*=\s*'.*')",
        r"(--|#|\/\*|\*\/)",
        r"(\b(UNION|UNION ALL)\b)",
        r"(\b(SCRIPT|EXEC|EXECUTE)\b)",
    ]

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def generate_csrf_token() -> str:
    """Generate a CSRF token"""
    return secrets.token_urlsafe(32)

def verify_csrf_token(token: str, session_token: str) -> bool:
    """Verify a CSRF token"""
    return hmac.compare_digest(token, session_token)

def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent XSS and injection attacks"""
    if not text:
        return ""
    
    # Remove potentially dangerous characters
    text = re.sub(r'[<>"\']', '', text)
    
    # Limit length
    text = text[:SecurityConfig.MAX_STRING_LENGTH]
    
    return text.strip()

def validate_input(text: str, field_name: str) -> str:
    """Validate and sanitize input based on field type"""
    if not text:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} cannot be empty"
        )
    
    # Check for SQL injection patterns
    for pattern in SecurityConfig.SQL_INJECTION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid characters detected in {field_name}"
            )
    
    # Sanitize the input
    sanitized = sanitize_input(text)
    
    if len(sanitized) == 0:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} cannot be empty after sanitization"
        )
    
    return sanitized

def validate_file_upload(filename: str, file_size: int) -> bool:
    """Validate file upload"""
    # Check file extension
    file_ext = '.' + filename.split('.')[-1].lower()
    if file_ext not in SecurityConfig.ALLOWED_FILE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file_ext} not allowed"
        )
    
    # Check file size
    if file_size > SecurityConfig.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size too large"
        )
    
    return True

def check_rate_limit(request: Request) -> bool:
    """Check if request is within rate limits"""
    client_ip = get_client_ip(request)
    current_time = time.time()
    
    if client_ip not in rate_limit_storage:
        rate_limit_storage[client_ip] = {
            'requests': [],
            'blocked_until': 0
        }
    
    client_data = rate_limit_storage[client_ip]
    
    # Check if client is blocked
    if current_time < client_data['blocked_until']:
        return False
    
    # Remove old requests outside the window
    window_start = current_time - SecurityConfig.RATE_LIMIT_WINDOW
    client_data['requests'] = [
        req_time for req_time in client_data['requests']
        if req_time > window_start
    ]
    
    # Check if limit exceeded
    if len(client_data['requests']) >= SecurityConfig.RATE_LIMIT_REQUESTS:
        client_data['blocked_until'] = current_time + SecurityConfig.RATE_LIMIT_WINDOW
        return False
    
    # Add current request
    client_data['requests'].append(current_time)
    return True

def get_client_ip(request: Request) -> str:
    """Get client IP address from request"""
    # Check for forwarded headers first
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct connection
    return request.client.host if request.client else "unknown"

def validate_url(url: str) -> bool:
    """Validate URL to prevent SSRF attacks"""
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

def generate_secure_filename(original_filename: str) -> str:
    """Generate a secure filename to prevent path traversal"""
    # Remove directory separators and dangerous characters
    safe_filename = re.sub(r'[^\w\-_\.]', '', original_filename)
    safe_filename = safe_filename.replace('..', '')
    
    # Add timestamp to prevent conflicts
    timestamp = str(int(time.time()))
    name, ext = os.path.splitext(safe_filename)
    return f"{name}_{timestamp}{ext}"

# Security headers middleware
def add_security_headers(request: Request, response):
    """Add security headers to response"""
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

# Authentication dependency
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

# Admin role check
def require_admin(current_user: dict = Depends(get_current_user)):
    """Require admin role"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
