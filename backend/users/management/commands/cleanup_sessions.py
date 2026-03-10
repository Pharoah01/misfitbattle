"""
Management command to cleanup expired sessions
Run this as a cron job: python manage.py cleanup_sessions
"""

from django.core.management.base import BaseCommand
from users.session_service import SessionSecurityService


class Command(BaseCommand):
    help = 'Cleanup expired user sessions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be cleaned up without actually doing it',
        )

    def handle(self, *args, **options):
        if options['dry_run']:
            self.stdout.write('DRY RUN - No sessions will be actually cleaned up')
        
        count = SessionSecurityService.cleanup_expired_sessions()
        
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING(f'Would clean up {count} expired sessions')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully cleaned up {count} expired sessions')
            )