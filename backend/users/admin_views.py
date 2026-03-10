"""
Admin views for session security management
"""

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .session_service import SessionSecurityService
from .session_models import UserSession, LoginAttempt, SecurityAlert, IPMonitoring
from .permissions import IsAdminUser

User = get_user_model()


class SessionManagementView(generics.GenericAPIView):
    """
    Admin view for managing user sessions
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """Get all active sessions"""
        sessions = UserSession.objects.filter(is_active=True).select_related('user')
        
        session_data = []
        for session in sessions:
            session_data.append({
                'session_id': str(session.session_id),
                'user': {
                    'id': session.user.id,
                    'register_number': session.user.register_number,
                    'name': session.user.name,
                },
                'ip_address': session.ip_address,
                'country': session.country,
                'city': session.city,
                'created_at': session.created_at,
                'last_activity': session.last_activity,
                'user_agent': session.user_agent[:100] + '...' if len(session.user_agent) > 100 else session.user_agent
            })
        
        return Response({
            'sessions': session_data,
            'total_count': len(session_data)
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def force_logout_user(request, user_id):
    """
    Force logout a specific user
    """
    user = get_object_or_404(User, id=user_id)
    
    success = SessionSecurityService.force_logout_user(user, request.user)
    
    if success:
        return Response({
            'message': f'User {user.register_number} has been logged out',
            'user': {
                'id': user.id,
                'register_number': user.register_number,
                'name': user.name
            }
        })
    else:
        return Response({
            'message': f'User {user.register_number} had no active session'
        }, status=status.HTTP_404_NOT_FOUND)


class SecurityDashboardView(generics.GenericAPIView):
    """
    Security dashboard with statistics and alerts
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """Get security dashboard data"""
        stats = SessionSecurityService.get_security_stats()
        
        # Get recent security alerts
        recent_alerts = SecurityAlert.objects.filter(
            resolved=False
        ).order_by('-created_at')[:10]
        
        alert_data = []
        for alert in recent_alerts:
            alert_data.append({
                'id': alert.id,
                'type': alert.get_alert_type_display(),
                'description': alert.description,
                'severity': alert.severity,
                'ip_address': alert.ip_address,
                'user': {
                    'register_number': alert.user.register_number,
                    'name': alert.user.name
                } if alert.user else None,
                'created_at': alert.created_at
            })
        
        # Get flagged IPs
        flagged_ips = IPMonitoring.objects.filter(
            is_flagged=True
        ).order_by('-user_count')[:10]
        
        ip_data = []
        for ip_monitor in flagged_ips:
            users = list(ip_monitor.users.values('register_number', 'name'))
            ip_data.append({
                'ip_address': ip_monitor.ip_address,
                'user_count': ip_monitor.user_count,
                'country': ip_monitor.country,
                'city': ip_monitor.city,
                'users': users,
                'first_seen': ip_monitor.first_seen,
                'last_seen': ip_monitor.last_seen
            })
        
        return Response({
            'statistics': stats,
            'recent_alerts': alert_data,
            'flagged_ips': ip_data
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def resolve_security_alert(request, alert_id):
    """
    Resolve a security alert
    """
    alert = get_object_or_404(SecurityAlert, id=alert_id)
    alert.resolve(resolved_by=request.user)
    
    return Response({
        'message': 'Security alert resolved',
        'alert': {
            'id': alert.id,
            'type': alert.get_alert_type_display(),
            'resolved_at': alert.resolved_at,
            'resolved_by': request.user.register_number
        }
    })


class LoginAttemptsView(generics.GenericAPIView):
    """
    View login attempts for security monitoring
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """Get recent login attempts"""
        # Get query parameters
        limit = int(request.GET.get('limit', 50))
        failed_only = request.GET.get('failed_only', 'false').lower() == 'true'
        
        attempts = LoginAttempt.objects.all()
        
        if failed_only:
            attempts = attempts.filter(success=False)
        
        attempts = attempts.order_by('-timestamp')[:limit]
        
        attempt_data = []
        for attempt in attempts:
            attempt_data.append({
                'id': attempt.id,
                'register_number': attempt.register_number,
                'ip_address': attempt.ip_address,
                'country': attempt.country,
                'city': attempt.city,
                'success': attempt.success,
                'timestamp': attempt.timestamp,
                'user_agent': attempt.user_agent[:100] + '...' if len(attempt.user_agent) > 100 else attempt.user_agent
            })
        
        return Response({
            'attempts': attempt_data,
            'total_count': len(attempt_data),
            'filters': {
                'failed_only': failed_only,
                'limit': limit
            }
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def cleanup_expired_sessions(request):
    """
    Manually trigger cleanup of expired sessions
    """
    count = SessionSecurityService.cleanup_expired_sessions()
    
    return Response({
        'message': f'Cleaned up {count} expired sessions',
        'cleaned_count': count
    })