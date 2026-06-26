from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubmissionViewSet, competition_status

router = DefaultRouter()
router.register(r'', SubmissionViewSet, basename='submission')

urlpatterns = [
    path('competition-status/', competition_status, name='competition-status'),
    path('', include(router.urls)),
]
