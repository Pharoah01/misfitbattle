"""
Custom CSRF middleware to disable CSRF for API endpoints
"""

from django.middleware.csrf import CsrfViewMiddleware
from django.conf import settings


class DisableCSRFMiddleware(CsrfViewMiddleware):
    """
    Disable CSRF protection for API endpoints
    """
    
    def process_view(self, request, callback, callback_args, callback_kwargs):
        # Disable CSRF for all API endpoints
        if request.path.startswith('/api/'):
            return None
        
        # Use default CSRF protection for other endpoints
        return super().process_view(request, callback, callback_args, callback_kwargs)