"""
Security Middleware for API Protection
Detects and blocks suspicious requests with email alerts
"""

import json
import logging
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
from django.conf import settings
from .services import security_service
import time

logger = logging.getLogger(__name__)

class APISecurityMiddleware(MiddlewareMixin):
    """
    Middleware to detect and block suspicious API requests with admin alerts
    """
    
    SUSPICIOUS_PATTERNS = [
        '/api/admin/',
        '/api/debug/',
        '/api/test/',
        '/api/internal/',
        
        '../',
        '..\\',
        '<script',
        'javascript:',
        'eval(',
        'exec(',
        
        "' OR '1'='1",
        '" OR "1"="1',
        'UNION SELECT',
        'DROP TABLE',
        
        '/etc/passwd',
        '/proc/version',
        'C:\\Windows\\',
    ]
    
    def process_request(self, request):
        """
        Process incoming request for security threats
        """
        if request.path.startswith('/admin/') or request.path.startswith('/static/'):
            return None
            
        if request.META.get('ADMIN_ACCESS'):
            return None
            
        client_ip = self.get_client_ip(request)
        
        if security_service.is_ip_blocked(client_ip):
            logger.warning(f"Blocked request from {client_ip}")
            return JsonResponse({
                'error': 'Access denied',
                'code': 'IP_BLOCKED'
            }, status=403)
        
        if self.is_suspicious_request(request):
            incident_type, severity = self.classify_threat(request)
            
            security_service.create_incident(
                ip_address=client_ip,
                incident_type=incident_type,
                severity=severity,
                path=request.path,
                method=request.method,
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                details={
                    'query_string': request.META.get('QUERY_STRING', ''),
                    'content_type': request.META.get('CONTENT_TYPE', ''),
                }
            )
            
            return JsonResponse({
                'error': 'Request blocked for security reasons',
                'code': 'SECURITY_VIOLATION'
            }, status=429)
        
        if self.is_endpoint_enumeration(request):
            security_service.create_incident(
                ip_address=client_ip,
                incident_type='ENDPOINT_ENUMERATION',
                severity='MEDIUM',
                path=request.path,
                method=request.method,
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
            )
            
            return JsonResponse({
                'error': 'Endpoint not found',
                'code': 'NOT_FOUND'
            }, status=404)
        
        return None
    
    def get_client_ip(self, request):
        """
        Get client IP address from request
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def classify_threat(self, request):
        """
        Classify the type and severity of threat
        """
        path = request.path.lower()
        query_string = request.META.get('QUERY_STRING', '').lower()
        
        sql_patterns = ["' OR '1'='1", '" OR "1"="1', 'UNION SELECT', 'DROP TABLE']
        for pattern in sql_patterns:
            if pattern.lower() in path or pattern.lower() in query_string:
                return 'SQL_INJECTION', 'CRITICAL'
        
        path_patterns = ['../', '..\\', '/etc/passwd', '/proc/version']
        for pattern in path_patterns:
            if pattern.lower() in path:
                return 'PATH_TRAVERSAL', 'HIGH'
        
        script_patterns = ['<script', 'javascript:', 'eval(', 'exec(']
        for pattern in script_patterns:
            if pattern.lower() in path or pattern.lower() in query_string:
                return 'SCRIPT_INJECTION', 'HIGH'
        
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        suspicious_agents = ['sqlmap', 'nikto', 'nmap', 'burp', 'owasp']
        for agent in suspicious_agents:
            if agent in user_agent:
                return 'AUTOMATED_TOOL', 'HIGH'
        
        return 'SUSPICIOUS_PATTERN', 'MEDIUM'
    
    def is_suspicious_request(self, request):
        """
        Check if request contains suspicious patterns
        """
        path = request.path.lower()
        for pattern in self.SUSPICIOUS_PATTERNS:
            if pattern.lower() in path:
                return True
        
        query_string = request.META.get('QUERY_STRING', '').lower()
        for pattern in self.SUSPICIOUS_PATTERNS:
            if pattern.lower() in query_string:
                return True
        
        if request.method == 'POST':
            try:
                body = request.body.decode('utf-8').lower()
                for pattern in self.SUSPICIOUS_PATTERNS:
                    if pattern.lower() in body:
                        return True
            except:
                pass
        
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        suspicious_agents = ['sqlmap', 'nikto', 'nmap', 'burp', 'owasp']
        for agent in suspicious_agents:
            if agent in user_agent:
                return True
        
        return False
    
    def is_endpoint_enumeration(self, request):
        """
        Detect API endpoint enumeration attempts
        """
        path = request.path
        
        enumeration_patterns = [
            '/api/v1/',
            '/api/v2/',
            '/api/users/',
            '/api/admin/',
            '/api/config/',
            '/api/status/',
            '/api/health/',
            '/api/debug/',
            '/api/test/',
        ]
        
        for pattern in enumeration_patterns:
            if path.startswith(pattern) and pattern not in ['/api/auth/', '/api/challenges/', '/api/submissions/']:
                return True
        
        return False


class RequestFingerprintMiddleware(MiddlewareMixin):
    """
    Middleware to validate request fingerprints from frontend
    """
    
    def process_request(self, request):
        """
        Validate request fingerprint if present
        """
        if not request.path.startswith('/api/'):
            return None
        
        fingerprint = request.META.get('HTTP_X_REQUEST_FINGERPRINT')
        if fingerprint:
            if not self.validate_fingerprint(fingerprint):
                logger.warning(f"Invalid request fingerprint from {self.get_client_ip(request)}")
                return JsonResponse({
                    'error': 'Invalid request',
                    'code': 'INVALID_REQUEST'
                }, status=400)
        
        return None
    
    def validate_fingerprint(self, fingerprint):
        """
        Validate request fingerprint format
        """
        if not fingerprint or len(fingerprint) != 16:
            return False
        
        try:
            import base64
            base64.b64decode(fingerprint + '==')  # Add padding
            return True
        except:
            return False
    
    def get_client_ip(self, request):
        """
        Get client IP address from request
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip