"""
Custom CSRF middleware — disables CSRF only for API endpoints.
Admin panel uses normal CSRF protection.
"""

from django.middleware.csrf import CsrfViewMiddleware


class DisableCSRFMiddleware(CsrfViewMiddleware):
    
    def process_view(self, request, callback, callback_args, callback_kwargs):
        # Skip CSRF for all API endpoints (they use token auth)
        if request.path.startswith('/api/'):
            return None
        
        # All other paths (including /admin/) get normal CSRF protection
        return super().process_view(request, callback, callback_args, callback_kwargs)
