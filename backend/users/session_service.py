"""
Session Security Service
Handles session creation, validation, and security monitoring
"""

import uuid
import logging
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model

from .session_models import UserSession, LoginAttempt, SecurityAlert, IPMonitoring

User = get_user_model()
logger = logging.getLogger(__name__)


class SessionSecurityService:
    """
    Service for managing secure user sessions
    """
    
    @staticmethod
    def get_client_ip(request):
        """Extract client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    @staticmethod
    def get_user_agent(request):
        """Extract user agent from request"""
        return request.META.get('HTTP_USER_AGENT', '')

    @staticmethod
    def create_session(user, request):
        """
        Create new session for user, invalidating any existing sessions
        """
        ip_address = SessionSecurityService.get_client_ip(request)
        user_agent = SessionSecurityService.get_user_agent(request)
        
        UserSession.objects.filter(user=user).delete()
        logger.info(f"Deleted any existing sessions for user {user.register_number}")
        
        session = UserSession.objects.create(
            user=user,
            session_id=uuid.uuid4(),
            ip_address=ip_address,
            user_agent=user_agent,
            is_active=True
        )
        
        session.get_location_info()
        session.save()
        
        SessionSecurityService.update_ip_monitoring(ip_address, user)
        
        SessionSecurityService.check_suspicious_login(user, ip_address, session.country)
        
        SessionSecurityService.log_login_attempt(
            user=user,
            register_number=user.register_number,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True
        )
        
        logger.info(f"Created new session for user {user.register_number} from {ip_address}")
        return session

    @staticmethod
    def validate_session(user, session_id):
        """
        Validate if session is active and belongs to user
        """
        try:
            session = UserSession.objects.get(
                user=user,
                session_id=session_id,
                is_active=True
            )
            
            if session.is_session_expired():
                session.invalidate()
                logger.info(f"Session expired for user {user.register_number}")
                return False
            
            session.last_activity = timezone.now()
            session.save(update_fields=['last_activity'])
            
            return True
            
        except UserSession.DoesNotExist:
            logger.warning(f"Invalid session attempt for user {user.register_number}")
            return False

    @staticmethod
    def invalidate_session(user):
        """
        Invalidate user's active session
        """
        try:
            session = UserSession.objects.get(user=user, is_active=True)
            session.invalidate()
            logger.info(f"Session invalidated for user {user.register_number}")
            return True
        except UserSession.DoesNotExist:
            return False

    @staticmethod
    def log_login_attempt(user=None, register_number=None, ip_address=None, user_agent='', success=False):
        """
        Log login attempt for security monitoring
        """
        attempt = LoginAttempt.objects.create(
            user=user,
            register_number=register_number or (user.register_number if user else ''),
            ip_address=ip_address,
            user_agent=user_agent,
            success=success
        )
        
        attempt.get_location_info()
        attempt.save()
        
        return attempt

    @staticmethod
    def update_ip_monitoring(ip_address, user):
        """
        Update IP monitoring for contest integrity
        """
        ip_monitor, created = IPMonitoring.objects.get_or_create(
            ip_address=ip_address,
            defaults={'user_count': 0}
        )
        
        if created:
            ip_monitor.get_location_info()
        
        ip_monitor.add_user(user)
        ip_monitor.last_seen = timezone.now()
        ip_monitor.save(update_fields=['last_seen'])

    @staticmethod
    def check_suspicious_login(user, ip_address, country):
        """
        Check for suspicious login patterns
        """
        recent_attempts = LoginAttempt.objects.filter(
            user=user,
            success=True,
            timestamp__gte=timezone.now() - timedelta(minutes=5)
        ).exclude(ip_address=ip_address)
        
        for attempt in recent_attempts:
            if attempt.country and country and attempt.country != country:
                SecurityAlert.objects.create(
                    alert_type='suspicious_login',
                    user=user,
                    ip_address=ip_address,
                    description=f"User {user.register_number} logged in from {country} within 5 minutes of login from {attempt.country}",
                    severity='high'
                )
                logger.warning(f"Suspicious login detected for user {user.register_number}: {attempt.country} -> {country}")
                break

    @staticmethod
    def get_session_info(user):
        """
        Get current session information for user
        """
        try:
            session = UserSession.objects.get(user=user, is_active=True)
            return {
                'session_id': str(session.session_id),
                'ip_address': session.ip_address,
                'country': session.country,
                'city': session.city,
                'created_at': session.created_at,
                'last_activity': session.last_activity,
                'user_agent': session.user_agent
            }
        except UserSession.DoesNotExist:
            return None

    @staticmethod
    def force_logout_user(user, admin_user=None):
        """
        Force logout user (admin function)
        """
        success = SessionSecurityService.invalidate_session(user)
        if success and admin_user:
            logger.info(f"Admin {admin_user.register_number} forced logout of user {user.register_number}")
        return success

    @staticmethod
    def cleanup_expired_sessions():
        """
        Cleanup expired sessions (run as periodic task)
        """
        expired_sessions = UserSession.objects.filter(
            is_active=True,
            last_activity__lt=timezone.now() - timedelta(minutes=30)
        )
        
        count = expired_sessions.count()
        expired_sessions.update(is_active=False)
        
        logger.info(f"Cleaned up {count} expired sessions")
        return count

    @staticmethod
    def get_security_stats():
        """
        Get security statistics for admin dashboard
        """
        return {
            'active_sessions': UserSession.objects.filter(is_active=True).count(),
            'total_sessions_today': UserSession.objects.filter(
                created_at__date=timezone.now().date()
            ).count(),
            'failed_logins_today': LoginAttempt.objects.filter(
                success=False,
                timestamp__date=timezone.now().date()
            ).count(),
            'unresolved_alerts': SecurityAlert.objects.filter(resolved=False).count(),
            'flagged_ips': IPMonitoring.objects.filter(is_flagged=True).count(),
        }