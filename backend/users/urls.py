from django.urls import path
from .views import SignUpView, SignInView, SignOutView, CurrentUserView, CompleteProfileView, UpdateProfileView, heartbeat, personal_stats
from . import admin_views
from .dashboard_views import admin_dashboard

urlpatterns = [
    path('signup/', SignUpView.as_view(), name='signup'),
    path('signin/', SignInView.as_view(), name='signin'),
    path('signout/', SignOutView.as_view(), name='signout'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('complete-profile/', CompleteProfileView.as_view(), name='complete-profile'),
    path('update-profile/', UpdateProfileView.as_view(), name='update-profile'),
    
    path('register/', SignUpView.as_view(), name='register'),
    path('login/', SignInView.as_view(), name='login'),
    path('logout/', SignOutView.as_view(), name='logout'),
    path('heartbeat/', heartbeat, name='heartbeat'),
    path('stats/', personal_stats, name='personal-stats'),
    
    path('admin/dashboard/', admin_dashboard, name='admin-dashboard-data'),
    path('admin/sessions/', admin_views.SessionManagementView.as_view(), name='admin-sessions'),
    path('admin/security-dashboard/', admin_views.SecurityDashboardView.as_view(), name='admin-security-dashboard'),
    path('admin/login-attempts/', admin_views.LoginAttemptsView.as_view(), name='admin-login-attempts'),
    path('admin/force-logout/<int:user_id>/', admin_views.force_logout_user, name='admin-force-logout'),
    path('admin/resolve-alert/<int:alert_id>/', admin_views.resolve_security_alert, name='admin-resolve-alert'),
    path('admin/cleanup-sessions/', admin_views.cleanup_expired_sessions, name='admin-cleanup-sessions'),
]
