from django.urls import path
from . import views

urlpatterns = [
    path('status/', views.practice_status, name='practice-status'),
    path('submit/', views.practice_submit, name='practice-submit'),
    path('history/<int:challenge_id>/', views.practice_history, name='practice-history'),
    path('leaderboard/', views.practice_leaderboard, name='practice-leaderboard'),
    path('solution/<int:challenge_id>/', views.official_solution, name='official-solution'),
    path('toggle/', views.toggle_practice_mode, name='toggle-practice'),
    path('publish-solution/<int:challenge_id>/', views.publish_solution, name='publish-solution'),
]
