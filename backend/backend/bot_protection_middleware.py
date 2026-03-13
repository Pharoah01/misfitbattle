"""
Bot Protection Middleware
Additional layer of protection against malicious bots and scanners
"""

from django.http import HttpResponseForbidden
from django.utils.deprecation import MiddlewareMixin
import re


class BotProtectionMiddleware(MiddlewareMixin):
    """
    Middleware to block malicious bots and scanners
    Works in conjunction with robots.txt
    """
    
    BLOCKED_USER_AGENTS = [
        r'sqlmap', r'nikto', r'nmap', r'masscan', r'zmap',
        r'gobuster', r'dirb', r'dirbuster', r'wpscan', r'nuclei',
        r'acunetix', r'nessus', r'openvas', r'w3af', r'havij',
        r'pangolin', r'sqlninja', r'burp', r'owasp',
        
        r'libwww-http', r'libredtail-http', r'python-requests',
        r'curl', r'wget', r'HTTPie',
        
        r'scrapy', r'BeautifulSoup', r'selenium', r'phantomjs',
        r'headless',
        
        r'.*scanner.*', r'.*exploit.*', r'.*hack.*', r'.*attack.*',
        r'.*pentest.*', r'.*vuln.*',
    ]
    
    BLOCKED_PATTERNS = [re.compile(pattern, re.IGNORECASE) for pattern in BLOCKED_USER_AGENTS]
    
    def process_request(self, request):
        """
        Check if the request is from a blocked bot
        """
        if request.path.startswith('/admin/') or request.META.get('ADMIN_ACCESS'):
            return None
            
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        
        for pattern in self.BLOCKED_PATTERNS:
            if pattern.search(user_agent):
                return HttpResponseForbidden(
                    "Access denied: Automated tools and scanners are not allowed",
                    content_type='text/plain'
                )
        
        if not user_agent or len(user_agent) < 10:
            return HttpResponseForbidden(
                "Access denied: Valid user agent required",
                content_type='text/plain'
            )
        
        return None
    
    def process_response(self, request, response):
        """
        Add security headers to discourage bots
        """
        response['X-Robots-Tag'] = 'noindex, nofollow, noarchive, nosnippet, noimageindex'
        
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['Referrer-Policy'] = 'no-referrer'
        
        return response