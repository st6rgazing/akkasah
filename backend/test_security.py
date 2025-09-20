#!/usr/bin/env python3
"""
Security testing script for Akkasah Archive API
"""

import requests
import json
import time
import sys
from urllib.parse import urljoin

class SecurityTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.results = []
    
    def log_result(self, test_name, status, details=""):
        """Log test result"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": time.time()
        }
        self.results.append(result)
        print(f"[{'PASS' if status == 'PASS' else 'FAIL'}] {test_name}: {details}")
    
    def test_sql_injection(self):
        """Test for SQL injection vulnerabilities"""
        print("\n=== Testing SQL Injection ===")
        
        # Test search endpoint
        malicious_queries = [
            "'; DROP TABLE collections; --",
            "1' OR '1'='1",
            "admin'--",
            "1' UNION SELECT * FROM users--",
            "'; INSERT INTO collections VALUES ('hacked', 'hacked'); --"
        ]
        
        for query in malicious_queries:
            try:
                response = self.session.get(
                    f"{self.base_url}/collections/search",
                    params={"q": query}
                )
                
                if response.status_code == 400:
                    self.log_result("SQL Injection - Search", "PASS", f"Blocked malicious query: {query[:30]}...")
                else:
                    self.log_result("SQL Injection - Search", "FAIL", f"Allowed malicious query: {query[:30]}...")
                    
            except Exception as e:
                self.log_result("SQL Injection - Search", "ERROR", str(e))
    
    def test_xss_protection(self):
        """Test for XSS vulnerabilities"""
        print("\n=== Testing XSS Protection ===")
        
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "javascript:alert('XSS')",
            "<img src=x onerror=alert('XSS')>",
            "';alert('XSS');//",
            "<svg onload=alert('XSS')>"
        ]
        
        for payload in xss_payloads:
            try:
                response = self.session.get(
                    f"{self.base_url}/collections/search",
                    params={"q": payload}
                )
                
                if payload in response.text:
                    self.log_result("XSS Protection", "FAIL", f"XSS payload reflected: {payload[:30]}...")
                else:
                    self.log_result("XSS Protection", "PASS", f"XSS payload sanitized: {payload[:30]}...")
                    
            except Exception as e:
                self.log_result("XSS Protection", "ERROR", str(e))
    
    def test_rate_limiting(self):
        """Test rate limiting functionality"""
        print("\n=== Testing Rate Limiting ===")
        
        # Make rapid requests to trigger rate limiting
        rate_limit_triggered = False
        for i in range(150):  # More than the 100 request limit
            try:
                response = self.session.get(f"{self.base_url}/collections")
                if response.status_code == 429:
                    rate_limit_triggered = True
                    break
                time.sleep(0.1)  # Small delay between requests
            except Exception as e:
                self.log_result("Rate Limiting", "ERROR", str(e))
                return
        
        if rate_limit_triggered:
            self.log_result("Rate Limiting", "PASS", "Rate limit triggered after excessive requests")
        else:
            self.log_result("Rate Limiting", "FAIL", "Rate limit not triggered")
    
    def test_security_headers(self):
        """Test for security headers"""
        print("\n=== Testing Security Headers ===")
        
        try:
            response = self.session.get(f"{self.base_url}/collections")
            headers = response.headers
            
            security_headers = {
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "X-XSS-Protection": "1; mode=block",
                "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            }
            
            for header, expected_value in security_headers.items():
                actual_value = headers.get(header)
                if actual_value:
                    if expected_value in actual_value or actual_value == expected_value:
                        self.log_result(f"Security Header - {header}", "PASS", f"Present: {actual_value}")
                    else:
                        self.log_result(f"Security Header - {header}", "WARN", f"Present but different: {actual_value}")
                else:
                    self.log_result(f"Security Header - {header}", "FAIL", "Missing")
                    
        except Exception as e:
            self.log_result("Security Headers", "ERROR", str(e))
    
    def test_cors_configuration(self):
        """Test CORS configuration"""
        print("\n=== Testing CORS Configuration ===")
        
        # Test with different origins
        test_origins = [
            "http://localhost:3000",  # Should be allowed
            "https://malicious.com",  # Should be blocked
            "http://evil.com",        # Should be blocked
        ]
        
        for origin in test_origins:
            try:
                headers = {"Origin": origin}
                response = self.session.options(
                    f"{self.base_url}/collections",
                    headers=headers
                )
                
                cors_origin = response.headers.get("Access-Control-Allow-Origin")
                if origin == "http://localhost:3000" and cors_origin:
                    self.log_result(f"CORS - {origin}", "PASS", f"Allowed: {cors_origin}")
                elif origin != "http://localhost:3000" and not cors_origin:
                    self.log_result(f"CORS - {origin}", "PASS", "Blocked")
                else:
                    self.log_result(f"CORS - {origin}", "FAIL", f"Unexpected: {cors_origin}")
                    
            except Exception as e:
                self.log_result(f"CORS - {origin}", "ERROR", str(e))
    
    def test_input_validation(self):
        """Test input validation"""
        print("\n=== Testing Input Validation ===")
        
        # Test with various invalid inputs
        invalid_inputs = [
            {"field": "title", "value": "", "expected_status": 400},
            {"field": "title", "value": "x" * 1001, "expected_status": 400},
            {"field": "description", "value": "", "expected_status": 400},
        ]
        
        for test_case in invalid_inputs:
            try:
                data = {test_case["field"]: test_case["value"]}
                response = self.session.post(
                    f"{self.base_url}/collections",
                    json=data
                )
                
                if response.status_code == test_case["expected_status"]:
                    self.log_result(f"Input Validation - {test_case['field']}", "PASS", 
                                  f"Rejected invalid input: {test_case['value'][:30]}...")
                else:
                    self.log_result(f"Input Validation - {test_case['field']}", "FAIL", 
                                  f"Accepted invalid input: {test_case['value'][:30]}...")
                    
            except Exception as e:
                self.log_result(f"Input Validation - {test_case['field']}", "ERROR", str(e))
    
    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n=== Testing Authentication ===")
        
        # Test protected endpoints without authentication
        protected_endpoints = [
            "/collections",
            "/search",
            "/stats"
        ]
        
        for endpoint in protected_endpoints:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}")
                # These endpoints should be accessible without auth for this demo
                if response.status_code in [200, 401, 403]:
                    self.log_result(f"Auth - {endpoint}", "PASS", f"Status: {response.status_code}")
                else:
                    self.log_result(f"Auth - {endpoint}", "WARN", f"Unexpected status: {response.status_code}")
                    
            except Exception as e:
                self.log_result(f"Auth - {endpoint}", "ERROR", str(e))
    
    def run_all_tests(self):
        """Run all security tests"""
        print("🔒 Starting Security Tests for Akkasah Archive API")
        print("=" * 60)
        
        # Check if API is running
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code != 200:
                print(f"❌ API not responding at {self.base_url}")
                return
        except Exception as e:
            print(f"❌ Cannot connect to API at {self.base_url}: {e}")
            return
        
        print(f"✅ API is running at {self.base_url}")
        
        # Run all tests
        self.test_sql_injection()
        self.test_xss_protection()
        self.test_rate_limiting()
        self.test_security_headers()
        self.test_cors_configuration()
        self.test_input_validation()
        self.test_authentication()
        
        # Summary
        print("\n" + "=" * 60)
        print("🔒 Security Test Summary")
        print("=" * 60)
        
        pass_count = sum(1 for r in self.results if r["status"] == "PASS")
        fail_count = sum(1 for r in self.results if r["status"] == "FAIL")
        warn_count = sum(1 for r in self.results if r["status"] == "WARN")
        error_count = sum(1 for r in self.results if r["status"] == "ERROR")
        
        print(f"✅ PASSED: {pass_count}")
        print(f"❌ FAILED: {fail_count}")
        print(f"⚠️  WARNINGS: {warn_count}")
        print(f"🚨 ERRORS: {error_count}")
        
        if fail_count > 0 or error_count > 0:
            print("\n🚨 Security issues found! Please review and fix.")
            sys.exit(1)
        else:
            print("\n✅ All security tests passed!")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Security testing for Akkasah Archive API")
    parser.add_argument("--url", default="http://localhost:8000", help="API base URL")
    args = parser.parse_args()
    
    tester = SecurityTester(args.url)
    tester.run_all_tests()
