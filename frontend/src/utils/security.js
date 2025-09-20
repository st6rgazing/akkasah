/**
 * Security utilities for the frontend
 */

// XSS Protection
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// CSRF Token Management
export const getCSRFToken = () => {
  const token = document.querySelector('meta[name="csrf-token"]');
  return token ? token.getAttribute('content') : null;
};

// Secure API calls
export const secureApiCall = async (url, options = {}) => {
  const defaultOptions = {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  };

  // Add CSRF token if available
  const csrfToken = getCSRFToken();
  if (csrfToken) {
    defaultOptions.headers['X-CSRF-Token'] = csrfToken;
  }

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);
    
    // Check for security headers
    if (response.headers.get('X-Content-Type-Options') !== 'nosniff') {
      console.warn('Missing X-Content-Type-Options header');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Input validation
export const validateInput = (input, type = 'text') => {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^https?:\/\/.+/,
    alphanumeric: /^[a-zA-Z0-9\s]+$/,
    search: /^[a-zA-Z0-9\s\-_.,!?]+$/,
  };

  const maxLengths = {
    email: 254,
    url: 2048,
    search: 500,
    text: 1000,
  };

  if (input.length > (maxLengths[type] || maxLengths.text)) {
    return false;
  }

  if (patterns[type] && !patterns[type].test(input)) {
    return false;
  }

  // Check for potentially dangerous content
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(input));
};

// Secure file upload validation
export const validateFileUpload = (file) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/tiff',
    'image/webp',
  ];

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.tiff', '.webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }

  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: 'Invalid file extension' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File too large' };
  }

  return { valid: true };
};

// Content Security Policy compliance
export const createSecureElement = (tag, content, attributes = {}) => {
  const element = document.createElement(tag);
  
  if (content) {
    element.textContent = content; // Use textContent to prevent XSS
  }
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key.startsWith('on')) {
      console.warn('Event handlers should not be set via attributes for security');
      return;
    }
    element.setAttribute(key, value);
  });
  
  return element;
};

// Rate limiting on client side
class ClientRateLimit {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  canMakeRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
}

export const clientRateLimit = new ClientRateLimit(10, 60000);

// Secure storage
export const secureStorage = {
  setItem: (key, value) => {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Failed to store data securely:', error);
    }
  },
  
  getItem: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to retrieve data securely:', error);
      return null;
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove data securely:', error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage securely:', error);
    }
  }
};

// Security headers check
export const checkSecurityHeaders = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const headers = response.headers;
    
    const securityHeaders = {
      'X-Content-Type-Options': headers.get('X-Content-Type-Options'),
      'X-Frame-Options': headers.get('X-Frame-Options'),
      'X-XSS-Protection': headers.get('X-XSS-Protection'),
      'Strict-Transport-Security': headers.get('Strict-Transport-Security'),
      'Content-Security-Policy': headers.get('Content-Security-Policy'),
    };
    
    return securityHeaders;
  } catch (error) {
    console.error('Failed to check security headers:', error);
    return null;
  }
};

// Error handling with security considerations
export const handleSecureError = (error, context = '') => {
  console.error(`Security error in ${context}:`, error);
  
  // Don't expose sensitive information in client-side errors
  const safeError = {
    message: 'An error occurred. Please try again.',
    code: 'SECURITY_ERROR',
    timestamp: new Date().toISOString(),
  };
  
  return safeError;
};
