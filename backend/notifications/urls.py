from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_notifications, name='notifications-list'),
    path('mark-read/', views.mark_read, name='notification-mark-read'),
    path('delete/', views.delete_notification, name='notification-delete'),
]
