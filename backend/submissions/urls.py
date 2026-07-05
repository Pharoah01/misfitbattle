from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubmissionViewSet, competition_status, pause_competition, resume_competition, extend_competition, retry_submission, submission_comparison, submission_detail
from .health import system_health

router = DefaultRouter()
router.register(r'', SubmissionViewSet, basename='submission')

urlpatterns = [
    path('competition-status/', competition_status, name='competition-status'),
    path('pause/', pause_competition, name='pause-competition'),
    path('resume/', resume_competition, name='resume-competition'),
    path('extend/', extend_competition, name='extend-competition'),
    path('health/', system_health, name='system-health'),
    path('<int:submission_id>/retry/', retry_submission, name='retry-submission'),
    path('<int:submission_id>/comparison/', submission_comparison, name='submission-comparison'),
    path('<int:submission_id>/detail/', submission_detail, name='submission-detail'),
    path('', include(router.urls)),
]
