from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubmissionViewSet, competition_status, pause_competition, resume_competition

router = DefaultRouter()
router.register(r'', SubmissionViewSet, basename='submission')

urlpatterns = [
    path('competition-status/', competition_status, name='competition-status'),
    path('pause/', pause_competition, name='pause-competition'),
    path('resume/', resume_competition, name='resume-competition'),
    path('', include(router.urls)),
]
