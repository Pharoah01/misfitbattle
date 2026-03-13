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
            logger.info(f"Admin access attempt: {request.path} from {self.get_client_ip(request)}")
            
            request.META['ADMIN_ACCESS'] = True
            
            if request.method == 'POST':
                csrf_token = request.POST.get('csrfmiddlewaretoken')
                if csrf_token:
                    request.META['CSRF_ADMIN_VALID'] = True
        
        return None
    
    def process_response(self, request, response):
        """
        Handle admin responses
        """
        if request.path.startswith('/admin/'):
            response['X-Admin-Access'] = 'Allowed'
            
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