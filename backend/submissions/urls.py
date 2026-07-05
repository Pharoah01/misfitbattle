from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubmissionViewSet, competition_status, pause_competition, resume_competition, extend_competition, retry_submission

router = DefaultRouter()
router.register(r'', SubmissionViewSet, basename='submission')

urlpatterns = [
    path('competition-status/', competition_status, name='competition-status'),
    path('pause/', pause_competition, name='pause-competition'),
    path('resume/', resume_competition, name='resume-competition'),
    path('extend/', extend_competition, name='extend-competition'),
    path('<int:submission_id>/retry/', retry_submission, name='retry-submission'),
    path('', include(router.urls)),
]
