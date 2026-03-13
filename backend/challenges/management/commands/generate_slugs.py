from django.core.management.base import BaseCommand
from challenges.models import Challenge
import re


class Command(BaseCommand):
    help = 'Generate slugs for challenges that don\'t have them'

    def slugify_title(self, title):
        """Convert title to slug format - matches frontend logic"""
        slug = title.lower()
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        slug = slug.strip('-')
        return slug

    def handle(self, *args, **options):
        challenges = Challenge.objects.filter(slug__isnull=True) | Challenge.objects.filter(slug='')
        
        if not challenges.exists():
            self.stdout.write(self.style.SUCCESS('✓ All challenges already have slugs!'))
            return
        
        self.stdout.write(f'Found {challenges.count()} challenge(s) without slugs')
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
            
            self.stdout.write(f'✓ {challenge.title}')
            self.stdout.write(f'  Slug: {slug}')
            self.stdout.write('')
        
        self.stdout.write('-' * 50)
        self.stdout.write(self.style.SUCCESS(f'✓ Generated slugs for {challenges.count()} challenge(s)'))