"""
Management command to send daily security summary to WhatsApp
Usage: python manage.py send_security_summary
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from security.models import SecurityIncident, BlockedIP
from security.whatsapp_service import whatsapp_service


class Command(BaseCommand):
    help = 'Send daily security summary to WhatsApp'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            help='Date for summary (YYYY-MM-DD), defaults to today',
        )

    def handle(self, *args, **options):
        # Get date for summary
        if options['date']:
            try:
                summary_date = datetime.strptime(options['date'], '%Y-%m-%d').date()
            except ValueError:
                self.stdout.write(
                    self.style.ERROR('Invalid date format. Use YYYY-MM-DD')
                )
                return
        else:
            summary_date = timezone.now().date()

        # Calculate date range
        start_date = datetime.combine(summary_date, datetime.min.time())
        end_date = start_date + timedelta(days=1)

        # Get security incidents for the day
        incidents = SecurityIncident.objects.filter(
            timestamp__gte=start_date,
            timestamp__lt=end_date
        )

        # Get blocked IPs for the day
        blocked_ips = BlockedIP.objects.filter(
            blocked_at__gte=start_date,
            blocked_at__lt=end_date
        )

        # Calculate summary statistics
        summary_data = {
            'total_incidents': incidents.count(),
            'critical_incidents': incidents.filter(severity='CRITICAL').count(),
            'high_incidents': incidents.filter(severity='HIGH').count(),
            'medium_incidents': incidents.filter(severity='MEDIUM').count(),
            'blocked_ips': blocked_ips.count(),
            'bot_attacks': incidents.filter(incident_type='AUTOMATED_TOOL').count(),
            'sql_injections': incidents.filter(incident_type='SQL_INJECTION').count(),
        }

        # Send WhatsApp summary
        try:
            success = whatsapp_service.send_daily_summary(summary_data)
            if success:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Daily security summary sent successfully for {summary_date}'
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        'Failed to send WhatsApp summary (check configuration)'
                    )
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error sending WhatsApp summary: {e}')
            )

        # Display summary to console
        self.stdout.write(f'\n📊 Security Summary for {summary_date}:')
        self.stdout.write(f'Total Incidents: {summary_data["total_incidents"]}')
        self.stdout.write(f'Critical: {summary_data["critical_incidents"]}')
        self.stdout.write(f'High: {summary_data["high_incidents"]}')
        self.stdout.write(f'Medium: {summary_data["medium_incidents"]}')
        self.stdout.write(f'Blocked IPs: {summary_data["blocked_ips"]}')
        self.stdout.write(f'Bot Attacks: {summary_data["bot_attacks"]}')
        self.stdout.write(f'SQL Injections: {summary_data["sql_injections"]}')