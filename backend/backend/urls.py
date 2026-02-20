"""
URL configuration for backend project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/challenges/', include('challenges.urls')),
    path('api/submissions/', include('submissions.urls')),
    path('api/leaderboard/', include('leaderboard.urls')),
]

