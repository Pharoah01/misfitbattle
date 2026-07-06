"""
Event Recovery — Run on application startup to restore competition state.

Usage:
    python manage.py recover
    
Automatically:
    - Requeues stuck submissions (rendering/scoring that never completed)
    - Validates service connectivity
    - Logs recovery to audit log

Safe to run multiple times (idempotent).
"""

import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from submissions.models import Submission
from submissions.health import check_database, check_redis, check_celery, check_playwright, check_storage

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Recover competition state after server restart'

    def handle(self, *args, **options):
        start = timezone.now()
        self.stdout.write(f'\n[Recovery] Started at {start.isoformat()}')
        self.stdout.write('=' * 50)

        # 1. Validate services
        self.stdout.write('\n[1/3] Checking services...')
        services = {
            'Database': check_database(),
            'Redis': check_redis(),
            'Celery': check_celery(),
            'Playwright': check_playwright(),
            'Storage': check_storage(),
        }

        all_ok = True
        for name, result in services.items():
            status = result.get('status', 'unknown')
            icon = '✓' if status == 'online' else '✗'
            self.stdout.write(f'  {icon} {name}: {status}')
            if status != 'online':
                all_ok = False

        if not all_ok:
            self.stdout.write(self.style.WARNING('\n  Some services are offline. Recovery will continue for available services.'))

        # 2. Recover stuck submissions
        self.stdout.write('\n[2/3] Recovering stuck submissions...')
        
        stuck = Submission.objects.filter(
            status__in=['rendering', 'scoring'],
            is_auto_save=False,
        )
        stuck_count = stuck.count()

        if stuck_count > 0:
            # Reset to queued so Celery picks them up again
            stuck.update(status='queued', error_message='Recovered after service restart')
            self.stdout.write(f'  Requeued {stuck_count} stuck submission(s)')

            # Re-dispatch to Celery if available
            if services['Celery'].get('status') == 'online':
                from submissions.tasks import process_submission_task
                from django.conf import settings
                if getattr(settings, 'USE_CELERY', False):
                    for sub_id in stuck.values_list('id', flat=True):
                        process_submission_task.delay(sub_id)
                    self.stdout.write(f'  Dispatched {stuck_count} task(s) to Celery')
        else:
            self.stdout.write('  No stuck submissions found')

        # 3. Competition state check
        self.stdout.write('\n[3/3] Validating competition state...')
        try:
            from submissions.competition_state import CompetitionState
            state = CompetitionState.get()
            self.stdout.write(f'  Competition state: {state.state}')
            self.stdout.write(f'  Total paused: {state.total_paused_seconds}s')
            self.stdout.write(f'  Total extended: {state.total_extended_seconds}s')
        except Exception as e:
            self.stdout.write(f'  Could not read competition state: {e}')

        # Log to audit
        try:
            from auditlog.services import log_event
            log_event('admin.action', description=f'System recovery completed. {stuck_count} submissions requeued.')
        except Exception:
            pass

        end = timezone.now()
        duration = (end - start).total_seconds()
        self.stdout.write(f'\n{"=" * 50}')
        self.stdout.write(self.style.SUCCESS(f'[Recovery] Completed in {duration:.1f}s'))
        self.stdout.write(f'  Stuck submissions recovered: {stuck_count}')
        self.stdout.write(f'  Services online: {sum(1 for s in services.values() if s.get("status") == "online")}/{len(services)}')
