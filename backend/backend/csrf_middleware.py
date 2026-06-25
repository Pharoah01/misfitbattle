"""
Disable CSRF entirely — API uses token auth, admin is behind login + VPN/IP restriction.
"""

from django.utils.deprecation import MiddlewareMixin


class DisableCSRFMiddleware(MiddlewareMixin):
    def process_request(self, request):
        setattr(request, '_dont_enforce_csrf_checks', True)
