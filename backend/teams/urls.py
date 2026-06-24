from django.urls import path
from . import views

urlpatterns = [
    path('my-team/', views.my_team, name='my-team'),
    path('create/', views.create_team, name='create-team'),
    path('join/', views.join_team, name='join-team'),
    path('leave/', views.leave_team, name='leave-team'),
]
