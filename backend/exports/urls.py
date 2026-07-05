from django.urls import path
from . import views

urlpatterns = [
    path('leaderboard/', views.export_leaderboard, name='export-leaderboard'),
    path('teams/', views.export_teams, name='export-teams'),
    path('participants/', views.export_participants, name='export-participants'),
    path('submissions/', views.export_submissions, name='export-submissions'),
    path('challenge-scores/', views.export_challenge_scores, name='export-challenge-scores'),
]
