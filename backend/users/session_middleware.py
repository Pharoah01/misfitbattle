"""
Session Security Middleware
Validates sessions on every request to protected endpoints
"""

import logging
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.authtoken.models import Token
from .session_service import SessionSecurityService
from .session_models import UserSession

User = get_user_model()
logger = logging.getLogger(__name__)


class SessionSecurityMiddleware:
    """
    Middleware to validate active sessions on protected endpoints
    """
    
    # Endpoints that require session validation
    PROTECTED_PATHS = [
        '/api/dashboard/',
        '/api/challenges/',
        '/api/submissions/',
        '/api/users/profile/',
        '/api/users/current/',
        '/api/users/complete-profile/',
        '/api/users/update-profile/',
    ]
    
    # Endpoints to skip (auth endpoints, public endpoints)
    SKIP_PATHS = [
        '/api/auth/signin/',
        '/api/auth/signup/',
        '/api/auth/signout/',
        '/admin/',
        '/static/',
        '/media/',
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Process request before view
        response = self.process_request(request)
        if response:
            return response
            
        # Get response from view
        response = self.get_response(request)
        
        return response

    def process_request(self, request):
        """
        Validate session before processing request
        """
        # Skip validation for certain paths
        if any(request.path.startswith(path) for path in self.SKIP_PATHS):
            return None
            
        # Only validate protected paths
        if not any(request.path.startswith(path) for path in self.PROTECTED_PATHS):
            return None
            
        # Skip if no authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Token '):
            return None
            
        try:
            # Extract token
            token_key = auth_header.split(' ')[1]
            token = Token.objects.get(key=token_key)
            user = token.user
            
            # Check if user has active session
            try:
                session = UserSession.objects.get(user=user, is_active=True)
                
                # Validate session hasn't expired
                if session.is_session_expired():
                    session.invalidate()
                    logger.info(f"Session expired for user {user.register_number}")
                    return JsonResponse({
                        'error': 'Session expired. Please login again.',
                        'code': 'SESSION_EXPIRED'
                    }, status=401)
                
                # Update last activity
                session.last_activity = timezone.now()
                session.save(update_fields=['last_activity'])
                
                # Add session info to request
                request.user_session = session
                
            except UserSession.DoesNotExist:
                logger.warning(f"No active session for authenticated user {user.register_number}")
                return JsonResponse({
                    'error': 'No active session. Please login again.',
                    'code': 'NO_ACTIVE_SESSION'
                }, status=401)
                
        except (Token.DoesNotExist, IndexError, ValueError):
            # Invalid token format or token doesn't exist
            return None
            
        return None


class IPTrackingMiddleware:
    """
    Middleware to track IP addresses for security monitoring
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Add IP address to request
        request.client_ip = SessionSecurityService.get_client_ip(request)
        
        response = self.get_response(request)
        return response