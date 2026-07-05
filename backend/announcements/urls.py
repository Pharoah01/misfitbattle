from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_announcements, name='announcements-list'),
    path('mark-read/', views.mark_read, name='mark-read'),
    path('mark-all-read/', views.mark_all_read, name='mark-all-read'),
    path('create/', views.create_announcement, name='create-announcement'),
    path('<int:announcement_id>/delete/', views.delete_announcement, name='delete-announcement'),
    path('<int:announcement_id>/pin/', views.pin_announcement, name='pin-announcement'),
]
