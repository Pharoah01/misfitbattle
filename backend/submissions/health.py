"""
System Health & Queue Monitoring API
"""

import time
import logging
from django.db import connection
from django.conf import settings
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Submission
from pathlib import Path

logger = logging.getLogger(__name__)


def check_database():
    """Check database connectivity."""
    start = time.time()
    try:
        connection.ensure_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        return {'status': 'online', 'response_ms': round((time.time() - start) * 1000, 1)}
    except Exception as e:
        return {'status': 'offline', 'error': str(e)}


def check_redis():
    """Check Redis connectivity."""
    start = time.time()
    try:
        import redis
        r = redis.from_url(getattr(settings, 'CELERY_BROKER_URL', 'redis://localhost:6379/0'))
        r.ping()
        return {'status': 'online', 'response_ms': round((time.time() - start) * 1000, 1)}
    except Exception as e:
        return {'status': 'offline', 'error': str(e)}


def check_celery():
    """Check Celery worker availability."""
    try:
        from backend.celery import app
        inspector = app.control.inspect(timeout=2)
        active = inspector.active()
        if active:
            workers = list(active.keys())
            busy = sum(len(tasks) for tasks in active.values())
            stats = inspector.stats() or {}
            return {
                'status': 'online',
                'workers': len(workers),
                'busy': busy,
                'worker_names': workers,
            }
        return {'status': 'offline', 'workers': 0}
    except Exception as e:
        return {'status': 'offline', 'error': str(e), 'workers': 0}


def check_playwright():
    """Check if Playwright binary exists."""
    path = Path('/opt/misfitbattle/playwright-browsers/chromium-1223/chrome-linux64/chrome')
    if not path.exists():
        path = Path('/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome')
    return {'status': 'online' if path.exists() else 'offline', 'path': str(path)}


def check_storage():
    """Check media storage."""
    media_root = Path(settings.MEDIA_ROOT)
    try:
        media_root.mkdir(parents=True, exist_ok=True)
        test_file = media_root / '.health_check'
        test_file.write_text('ok')
        test_file.unlink()
        return {'status': 'online'}
    except Exception as e:
        return {'status': 'offline', 'error': str(e)}


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_health(request):
    """Admin: Full system health + queue status."""
    if not request.user.is_admin:
        return Response({'error': 'Admin only'}, status=403)

    now = timezone.now()
    today = now.date()

    # Health checks
    health = {
        'database': check_database(),
        'redis': check_redis(),
        'celery': check_celery(),
        'playwright': check_playwright(),
        'storage': check_storage(),
    }

    # Queue stats
    queue = {
        'queued': Submission.objects.filter(status='queued', is_auto_save=False).count(),
        'rendering': Submission.objects.filter(status='rendering').count(),
        'scoring': Submission.objects.filter(status='scoring').count(),
        'completed': Submission.objects.filter(status='completed', is_auto_save=False).count(),
        'failed': Submission.objects.filter(status='failed').count(),
    }

    # Failed jobs detail
    failed_jobs = list(
        Submission.objects.filter(status='failed')
        .select_related('user', 'challenge')
        .order_by('-submitted_at')[:20]
        .values(
            'id', 'user__htp_id', 'user__name',
            'challenge__title', 'error_message', 'submitted_at'
        )
    )

    # Stats
    today_subs = Submission.objects.filter(submitted_at__date=today, is_auto_save=False)
    stats = {
        'total_today': today_subs.count(),
        'completed_today': today_subs.filter(status='completed').count(),
        'failed_today': today_subs.filter(status='failed').count(),
    }

    # --- Generate alerts ---
    alerts = []
    
    if health['database'].get('status') == 'offline':
        alerts.append({'service': 'Database', 'severity': 'critical', 'description': 'Database connection failed'})
    
    if health['redis'].get('status') == 'offline':
        alerts.append({'service': 'Redis', 'severity': 'critical', 'description': 'Redis connection failed'})
    
    if health['celery'].get('status') == 'offline':
        alerts.append({'service': 'Celery', 'severity': 'critical', 'description': 'No Celery workers available'})
    
    if health['playwright'].get('status') == 'offline':
        alerts.append({'service': 'Playwright', 'severity': 'warning', 'description': 'Playwright binary not found'})
    
    if health['storage'].get('status') == 'offline':
        alerts.append({'service': 'Storage', 'severity': 'critical', 'description': 'File storage write failed'})
    
    if queue['queued'] > 20:
        alerts.append({'service': 'Queue', 'severity': 'warning', 'description': f'High queue length: {queue["queued"]} pending'})
    
    if queue['failed'] > 5:
        alerts.append({'service': 'Submissions', 'severity': 'warning', 'description': f'{queue["failed"]} failed submissions'})

    return Response({
        'health': health,
        'queue': queue,
        'failed_jobs': failed_jobs,
        'stats': stats,
        'alerts': alerts,
        'alert_count': len(alerts),
        'timestamp': now.isoformat(),
    })
