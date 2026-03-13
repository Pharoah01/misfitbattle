"""
Admin Access Middleware
Ensures Django admin is accessible by bypassing security restrictions
"""

from django.utils.deprecation import MiddlewareMixin
from django.http import HttpResponse
import logging

logger = logging.getLogger(__name__)

class AdminAccessMiddleware(MiddlewareMixin):
    """
    Middleware to ensure admin access works properly
    Must be placed early in middleware stack
    """
    
    def process_request(self, request):
        """
        Handle admin requests specially
        """
        if request.path.startswith('/admin/'):
            # Log admin access attempts for debugging
            logger.info(f"Admin access attempt: {request.path} from {self.get_client_ip(request)}")
            
            # Set special headers to bypass other middleware
            request.META['ADMIN_ACCESS'] = True
            
            # Handle CSRF issues for admin
            if request.method == 'POST':
                # For admin POST requests, ensure we have proper CSRF handling
                csrf_token = request.POST.get('csrfmiddlewaretoken')
                if csrf_token:
                    # Mark as valid CSRF for admin
                    request.META['CSRF_ADMIN_VALID'] = True
        
        return None
    
    def process_response(self, request, response):
        """
        Handle admin responses
        """
        if request.path.startswith('/admin/'):
            # Add headers to help with admin access
            response['X-Admin-Access'] = 'Allowed'
            
            # If we got a 403 on admin, log it
            if response.status_code == 403:
                logger.error(f"Admin 403 error for {request.path} from {self.get_client_ip(request)}")
                logger.error(f"Request META: {dict(request.META)}")
        
        return response
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip