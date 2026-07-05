"""
Audit Log Service — simple function to log events from anywhere.

Usage:
    from auditlog.services import log_event
    log_event('auth.login', user=request.user, request=request, description='User logged in')
"""

import logging
from .models import AuditLog

logger = logging.getLogger(__name__)


def log_event(event_type, user=None, request=None, description='',
              team_name='', challenge_title='', before_value='', after_value=''):
    """
    Log an audit event. Non-blocking — catches all exceptions silently.
    """
    try:
        ip = ''
        ua = ''
        if request:
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = x_forwarded.split(',')[0] if x_forwarded else request.META.get('REMOTE_ADDR', '')
            ua = request.META.get('HTTP_USER_AGENT', '')[:500]

        AuditLog.objects.create(
            event_type=event_type,
            user=user,
            team_name=team_name,
            challenge_title=challenge_title,
            ip_address=ip or None,
            user_agent=ua,
            description=description,
            before_value=str(before_value) if before_value else '',
            after_value=str(after_value) if after_value else '',
        )
    except Exception as e:
        logger.error(f"Audit log failed: {e}")
