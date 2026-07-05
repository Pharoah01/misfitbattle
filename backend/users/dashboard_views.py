"""
Admin Dashboard API — comprehensive monitoring endpoint.
Only accessible by superusers and is_admin users.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Count, Avg, Q
from datetime import timedelta
from .permissions import IsAdminUser
from .session_models import UserSession, LoginAttempt, SecurityAlert, IPMonitoring
from submissions.models import Submission
from challenges.models import Challenge
from teams.models import Team

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_dashboard(request):
    """Full dashboard data in one request for real-time polling."""
    now = timezone.now()
    today = now.date()

    # --- Stats ---
    total_users = User.objects.count()
    users_today = User.objects.filter(created_at__date=today).count()
    total_submissions = Submission.objects.count()
    submissions_today = Submission.objects.filter(submitted_at__date=today).count()
    total_teams = Team.objects.count()
    full_teams = Team.objects.filter(is_full=True).count()
    active_sessions = UserSession.objects.filter(is_active=True).count()
    total_challenges = Challenge.objects.count()

    # --- Recent Users (last 20) ---
    recent_users = list(
        User.objects.order_by('-created_at')[:20].values(
            'id', 'htp_id', 'name', 'email', 'college_name',
            'department', 'is_admin', 'created_at'
        )
    )

    # --- Teams ---
    teams = list(
        Team.objects.select_related('leader', 'member')
        .order_by('-created_at')[:30]
        .values(
            'id', 'name', 'invite_code', 'is_full',
            'leader__htp_id', 'leader__name',
            'member__htp_id', 'member__name',
            'created_at'
        )
    )

    # --- Recent Submissions (last 30) ---
    recent_submissions = list(
        Submission.objects.select_related('user', 'challenge')
        .order_by('-submitted_at')[:30]
        .values(
            'id', 'user__htp_id', 'user__name',
            'challenge__title', 'challenge__difficulty',
            'code_length', 'similarity_score', 'status',
            'is_auto_save', 'submitted_at'
        )
    )

    # --- Active Sessions ---
    sessions = list(
        UserSession.objects.filter(is_active=True)
        .select_related('user')
        .order_by('-last_activity')[:30]
        .values(
            'user__htp_id', 'user__name',
            'ip_address', 'country', 'city',
            'created_at', 'last_activity', 'current_page'
        )
    )

    # --- Security ---
    failed_logins_today = LoginAttempt.objects.filter(
        success=False, timestamp__date=today
    ).count()

    recent_alerts = list(
        SecurityAlert.objects.filter(resolved=False)
        .order_by('-created_at')[:10]
        .values(
            'id', 'alert_type', 'ip_address',
            'description', 'severity', 'created_at',
            'user__htp_id', 'user__name'
        )
    )

    flagged_ips = list(
        IPMonitoring.objects.filter(is_flagged=True)
        .order_by('-user_count')[:10]
        .values('ip_address', 'user_count', 'country', 'city', 'last_seen')
    )

    recent_login_attempts = list(
        LoginAttempt.objects.order_by('-timestamp')[:20]
        .values(
            'register_number', 'ip_address', 'country',
            'success', 'timestamp'
        )
    )

    # --- Challenge Stats ---
    challenge_stats = list(
        Challenge.objects.annotate(
            submission_count=Count('submissions'),
            completed_count=Count('submissions', filter=Q(submissions__is_auto_save=False)),
        ).values('id', 'title', 'difficulty', 'points', 'is_released', 'is_locked', 'submission_count', 'completed_count')
        .order_by('difficulty', 'created_at')
    )

    return Response({
        'stats': {
            'total_users': total_users,
            'users_today': users_today,
            'total_submissions': total_submissions,
            'submissions_today': submissions_today,
            'total_teams': total_teams,
            'full_teams': full_teams,
            'active_sessions': active_sessions,
            'total_challenges': total_challenges,
            'failed_logins_today': failed_logins_today,
        },
        'recent_users': recent_users,
        'teams': teams,
        'recent_submissions': recent_submissions,
        'sessions': sessions,
        'security': {
            'alerts': recent_alerts,
            'flagged_ips': flagged_ips,
            'recent_logins': recent_login_attempts,
        },
        'challenge_stats': challenge_stats,
        'timestamp': now,
    })
