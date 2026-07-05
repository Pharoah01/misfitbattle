"""
Notification Service — create notifications from anywhere.

Usage:
    from notifications.services import notify, notify_team
    notify(user, 'submission_scored', 'Challenge Scored', '95.2% match', link='/team')
    notify_team(team, 'challenge_released', 'New Challenge', 'Hard challenge released', link='/dashboard')
"""

import logging
from .models import Notification

logger = logging.getLogger(__name__)


def notify(user, notification_type, title, message='', link=''):
    """Create a notification for a single user."""
    try:
        Notification.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            link=link,
        )
    except Exception as e:
        logger.error(f"Notification failed: {e}")


def notify_team(team, notification_type, title, message='', link=''):
    """Notify all members of a team."""
    members = [team.leader]
    if team.member:
        members.append(team.member)
    for user in members:
        notify(user, notification_type, title, message, link)


def notify_all(notification_type, title, message='', link=''):
    """Broadcast notification to all users."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    users = User.objects.all()
    notifications = [
        Notification(user=u, notification_type=notification_type, title=title, message=message, link=link)
        for u in users
    ]
    Notification.objects.bulk_create(notifications, ignore_conflicts=True)
