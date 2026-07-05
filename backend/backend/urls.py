"""
URL configuration for backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from django.views.generic import TemplateView
import os

def robots_txt(request):
    """Serve robots.txt file"""
    robots_path = os.path.join(settings.BASE_DIR, 'static', 'robots.txt')
    try:
        with open(robots_path, 'r') as f:
            content = f.read()
        return HttpResponse(content, content_type='text/plain')
    except FileNotFoundError:
        content = """# Misfits Battle Backend - Block All Bots
User-agent: *
Disallow: /
"""
        return HttpResponse(content, content_type='text/plain')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/challenges/', include('challenges.urls')),
    path('api/submissions/', include('submissions.urls')),
    path('api/teams/', include('teams.urls')),
    path('api/leaderboard/', include('leaderboard.urls')),
    path('api/announcements/', include('announcements.urls')),
    path('api/audit/', include('auditlog.urls')),
    path('api/practice/', include('practice.urls')),
    path('api/export/', include('exports.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('robots.txt', robots_txt, name='robots_txt'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

