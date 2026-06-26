"""
Management command to release/unrelease/lock/unlock challenges.

Usage:
  python manage.py release_challenges --release --difficulty easy
  python manage.py release_challenges --release --id 5
  python manage.py release_challenges --unrelease --difficulty hard
  python manage.py release_challenges --lock --id 3
  python manage.py release_challenges --unlock --all
  python manage.py release_challenges --status
"""

from django.core.management.base import BaseCommand
from challenges.models import Challenge


class Command(BaseCommand):
    help = 'Release, unrelease, lock, or unlock challenges'

    def add_arguments(self, parser):
        action = parser.add_mutually_exclusive_group()
        action.add_argument('--release', action='store_true', help='Release challenges')
        action.add_argument('--unrelease', action='store_true', help='Hide challenges')
        action.add_argument('--lock', action='store_true', help='Lock submissions')
        action.add_argument('--unlock', action='store_true', help='Unlock submissions')
        action.add_argument('--status', action='store_true', help='Show status')

        target = parser.add_mutually_exclusive_group()
        target.add_argument('--all', action='store_true', help='All challenges')
        target.add_argument('--difficulty', choices=['easy', 'medium', 'hard'])
        target.add_argument('--id', type=int, help='Specific challenge ID')
        target.add_argument('--title', type=str, help='Challenge title (partial match)')

    def handle(self, *args, **options):
        if options['status']:
            self._show_status()
            return

        qs = self._get_queryset(options)
        if not qs.exists():
            self.stdout.write(self.style.WARNING('No challenges matched.'))
            return

        if options['release']:
            count = qs.update(is_released=True)
            self.stdout.write(self.style.SUCCESS(f'Released {count} challenge(s)'))
        elif options['unrelease']:
            count = qs.update(is_released=False)
            self.stdout.write(self.style.SUCCESS(f'Hidden {count} challenge(s)'))
        elif options['lock']:
            count = qs.update(is_locked=True)
            self.stdout.write(self.style.SUCCESS(f'Locked {count} challenge(s)'))
        elif options['unlock']:
            count = qs.update(is_locked=False)
            self.stdout.write(self.style.SUCCESS(f'Unlocked {count} challenge(s)'))
        else:
            self.stdout.write(self.style.ERROR('Specify --release, --unrelease, --lock, --unlock, or --status'))


        for c in qs:
            status_str = f"{'Released' if c.is_released else 'Hidden':>8} | {'Locked' if c.is_locked else 'Open':>6} | {c.title}"
            self.stdout.write(f"  {status_str}")

    def _get_queryset(self, options):
        qs = Challenge.objects.all()
        if options.get('id'):
            qs = qs.filter(id=options['id'])
        elif options.get('difficulty'):
            qs = qs.filter(difficulty=options['difficulty'])
        elif options.get('title'):
            qs = qs.filter(title__icontains=options['title'])
        elif not options.get('all'):
            self.stdout.write(self.style.ERROR('Specify --all, --difficulty, --id, or --title'))
            return Challenge.objects.none()
        return qs

    def _show_status(self):
        challenges = Challenge.objects.all().order_by('difficulty', 'title')
        self.stdout.write(f"\n{'Status':<10} {'Lock':<8} {'Diff':<8} {'Title'}")
        self.stdout.write('-' * 60)
        for c in challenges:
            rel = self.style.SUCCESS('Released') if c.is_released else self.style.WARNING('Hidden')
            lock = self.style.ERROR('Locked') if c.is_locked else 'Open'
            self.stdout.write(f"{rel:<20} {lock:<16} {c.difficulty:<8} {c.title}")
        self.stdout.write(f"\nTotal: {challenges.count()} challenges")
