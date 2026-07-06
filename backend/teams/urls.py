from django.urls import path
from . import views

urlpatterns = [
    path('my-team/', views.my_team, name='my-team'),
    path('create/', views.create_team, name='create-team'),
    path('join/', views.join_team, name='join-team'),
    path('leave/', views.leave_team, name='leave-team'),
    path('go-solo/', views.go_solo, name='go-solo'),
    path('dashboard/', views.team_dashboard, name='team-dashboard'),
    path('claim/', views.claim_challenge, name='claim-challenge'),
    path('unclaim/', views.unclaim_challenge, name='unclaim-challenge'),
    path('profile/<str:team_name>/', views.team_public_profile, name='team-profile'),
]
