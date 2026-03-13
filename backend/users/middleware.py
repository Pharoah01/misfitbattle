"""
Profile Completion Middleware
Enforces profile completion before accessing protected resources.
"""
from django.http import JsonResponse


class ProfileCompletionMiddleware:
    """
    Middleware to enforce profile completion for authenticated users.
    
    Blocks access to protected routes if user's profile is not completed.
    Exempt paths: /api/auth/, /api/users/complete-profile/, /admin/, /media/, /static/
    """
    
    EXEMPT_PATHS = [
        '/api/auth/',
        '/api/users/complete-profile/',
        '/admin/',
        '/media/',
        '/static/',
        '/api/challenges/',  # Allow viewing challenges without profile completion
    ]
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        if self._requires_profile(request.path):
            if request.user.is_authenticated:
                if not request.user.is_superuser and not request.user.profile_completed:
                    return JsonResponse(
                        {'error': 'Please complete your profile first'},
                        status=403
                    )
        
        return self.get_response(request)
    
    def _requires_profile(self, path):
        """Check if the given path requires profile completion."""
        for exempt_path in self.EXEMPT_PATHS:
            if path.startswith(exempt_path):
                return False
        
        return path.startswith('/api/')
