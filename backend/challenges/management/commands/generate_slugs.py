from django.core.management.base import BaseCommand
from challenges.models import Challenge
import re


class Command(BaseCommand):
    help = 'Generate or revoke slugs for challenges with difficulty filtering'

    def add_arguments(self, parser):
        parser.add_argument(
            '--revoke',
            choices=['all', 'easy', 'medium', 'hard'],
            help='Revoke slugs for challenges (all or by difficulty)'
        )
        parser.add_argument(
            '--difficulty',
            choices=['easy', 'medium', 'hard'],
            help='Generate slugs only for challenges of specified difficulty'
        )

    def slugify_title(self, title):
        """Convert title to slug format - matches frontend logic"""
        slug = title.lower()
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        slug = slug.strip('-')
        return slug

    def handle(self, *args, **options):
        revoke = options.get('revoke')
        difficulty = options.get('difficulty')
        
        if revoke:
            self.handle_revoke(revoke)
            return
        
        self.handle_generate(difficulty)
    
    def handle_revoke(self, revoke_type):
        """Revoke slugs from challenges"""
        if revoke_type == 'all':
            challenges = Challenge.objects.exclude(slug__isnull=True).exclude(slug='')
        else:
            challenges = Challenge.objects.filter(difficulty=revoke_type).exclude(slug__isnull=True).exclude(slug='')
        
        if not challenges.exists():
            self.stdout.write(self.style.WARNING(f'No challenges found with slugs for: {revoke_type}'))
            return
        
        count = challenges.count()
        self.stdout.write(f'Found {count} challenge(s) with slugs to revoke ({revoke_type})')
        self.stdout.write('-' * 50)
        
        for challenge in challenges:
            old_slug = challenge.slug
            challenge.slug = None
            challenge.save()
            
            self.stdout.write(f'✗ {challenge.title} ({challenge.difficulty})')
            self.stdout.write(f'  Revoked slug: {old_slug}')
            self.stdout.write('')
        
        self.stdout.write('-' * 50)
        self.stdout.write(self.style.SUCCESS(f'✓ Revoked slugs from {count} challenge(s)'))
    
    def handle_generate(self, difficulty=None):
        """Generate slugs for challenges"""
        challenges = Challenge.objects.filter(slug__isnull=True) | Challenge.objects.filter(slug='')
        
        if difficulty:
            challenges = challenges.filter(difficulty=difficulty)
        
        if not challenges.exists():
            if difficulty:
                self.stdout.write(self.style.SUCCESS(f'✓ All {difficulty} challenges already have slugs!'))
            else:
                self.stdout.write(self.style.SUCCESS('✓ All challenges already have slugs!'))
            return
        
        count = challenges.count()
        difficulty_text = f' ({difficulty})' if difficulty else ''
        self.stdout.write(f'Found {count} challenge(s) without slugs{difficulty_text}')
        self.stdout.write('-' * 50)
        
        for challenge in challenges:
            base_slug = self.slugify_title(challenge.title)
            slug = base_slug
            counter = 1
            
            while Challenge.objects.filter(slug=slug).exclude(id=challenge.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            challenge.slug = slug
            challenge.save()
            
            self.stdout.write(f'✓ {challenge.title} ({challenge.difficulty})')
            self.stdout.write(f'  Slug: {slug}')
            self.stdout.write('')
        
        self.stdout.write('-' * 50)
        self.stdout.write(self.style.SUCCESS(f'✓ Generated slugs for {count} challenge(s){difficulty_text}'))