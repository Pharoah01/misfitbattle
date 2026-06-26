"""
Rejudge command — re-renders and re-scores submissions.

Usage:
  python manage.py rejudge --challenge <id>       # Rejudge all for a challenge
  python manage.py rejudge --challenge <id> --render-only  # Only re-render, skip heatmap
  python manage.py rejudge --submission <id>      # Rejudge single submission
  python manage.py rejudge --all                  # Rejudge everything (careful!)
  python manage.py rejudge --failed               # Retry only failed submissions
"""

import asyncio
from django.core.management.base import BaseCommand
from django.conf import settings
from submissions.models import Submission
from submissions.services.renderer import HTMLRenderer
from submissions.services.heatmap_client import HeatmapClient


class Command(BaseCommand):
    help = 'Rejudge submissions: re-render and recalculate similarity scores'

    def add_arguments(self, parser):
        target = parser.add_mutually_exclusive_group(required=True)
        target.add_argument('--challenge', type=int, help='Challenge ID')
        target.add_argument('--submission', type=int, help='Single submission ID')
        target.add_argument('--all', action='store_true', help='All submissions')
        target.add_argument('--failed', action='store_true', help='Only failed ones')

        parser.add_argument('--render-only', action='store_true', help='Skip heatmap')
        parser.add_argument('--dry-run', action='store_true', help='Show what would be rejudged')

    def handle(self, *args, **options):
        qs = self._get_queryset(options)

        if not qs.exists():
            self.stdout.write(self.style.WARNING('No submissions to rejudge.'))
            return

        count = qs.count()

        if options['dry_run']:
            self.stdout.write(f'Would rejudge {count} submission(s):')
            for sub in qs[:20]:
                self.stdout.write(f'  #{sub.id} - {sub.user.htp_id} - {sub.challenge.title}')
            if count > 20:
                self.stdout.write(f'  ... and {count - 20} more')
            return

        self.stdout.write(f'Rejudging {count} submission(s)...')
        self.stdout.write('-' * 50)

        renderer = HTMLRenderer()
        success = 0
        failed = 0

        for sub in qs:
            try:
                self._rejudge_one(sub, renderer, options['render_only'])
                success += 1
                score_str = f'{float(sub.similarity_score)*100:.1f}%' if sub.similarity_score else 'N/A'
                self.stdout.write(f'  OK  #{sub.id} {sub.user.htp_id} - {sub.challenge.title} → {score_str}')
            except Exception as e:
                failed += 1
                self.stdout.write(self.style.ERROR(f'  FAIL #{sub.id} {sub.user.htp_id} - {e}'))

        self.stdout.write('-' * 50)
        self.stdout.write(self.style.SUCCESS(f'Done. {success} OK, {failed} failed.'))

    def _get_queryset(self, options):
        qs = Submission.objects.select_related('user', 'challenge').filter(is_auto_save=False)

        if options.get('challenge'):
            qs = qs.filter(challenge_id=options['challenge'])
        elif options.get('submission'):
            qs = qs.filter(id=options['submission'])
        elif options.get('failed'):
            qs = qs.filter(status='failed')
        # --all returns full queryset

        return qs.order_by('submitted_at')

    def _rejudge_one(self, submission, renderer, render_only=False):
        """Re-render and optionally re-score a single submission."""
        submission.status = 'processing'
        submission.error_message = None
        submission.save(update_fields=['status', 'error_message'])

        # Re-render
        try:
            image_path = asyncio.run(
                renderer.render_submission(
                    html_code=submission.html_code,
                    css_code=submission.css_code,
                    challenge_name=submission.challenge.title,
                    user_email=submission.user.email or ''
                )
            )
            submission.rendered_image = image_path
        except Exception as e:
            submission.status = 'failed'
            submission.error_message = f'Render failed: {e}'
            submission.save(update_fields=['status', 'error_message', 'rendered_image'])
            raise

        if render_only:
            submission.status = 'completed'
            submission.save(update_fields=['status', 'rendered_image'])
            return

        # Re-score via heatmap
        if not submission.challenge.ground_truth_image:
            submission.status = 'completed'
            submission.similarity_score = None
            submission.save(update_fields=['status', 'rendered_image', 'similarity_score'])
            return

        try:
            client = HeatmapClient()
            score = client.compare(
                submission_image_path=submission.rendered_image.path,
                ground_truth_path=submission.challenge.ground_truth_image.path
            )
            submission.similarity_score = score
            submission.status = 'completed'
        except Exception as e:
            submission.status = 'completed'  # Render OK, heatmap failed
            submission.similarity_score = None
            submission.error_message = f'Heatmap failed: {e}'

        submission.save(update_fields=['status', 'rendered_image', 'similarity_score', 'error_message'])
