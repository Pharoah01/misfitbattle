"""
Custom CSRF middleware to disable CSRF for API endpoints
"""

from django.middleware.csrf import CsrfViewMiddleware
from django.conf import settings


class DisableCSRFMiddleware(CsrfViewMiddleware):
    """
    Disable CSRF protection for API endpoints and admin paths
    """
    
    def process_view(self, request, callback, callback_args, callback_kwargs):
        if request.path.startswith('/api/'):
            return None
            
        if request.path.startswith('/admin/'):
            return None
        
        return super().process_view(request, callback, callback_args, callback_kwargs)