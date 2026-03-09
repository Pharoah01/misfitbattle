#!/usr/bin/env python
"""
Script to generate slugs for existing challenges
Run with: ./env/bin/python generate_slugs.py
"""

import os
import django
import re

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from challenges.models import Challenge


def slugify_title(title):
    """Convert title to slug format"""
    # Convert to lowercase
    slug = title.lower()
    # Replace spaces and special characters with hyphens
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    return slug


def generate_slugs():
    """Generate slugs for all challenges without slugs"""
    challenges = Challenge.objects.filter(slug__isnull=True) | Challenge.objects.filter(slug='')
    
    if not challenges.exists():
        print("✓ All challenges already have slugs!")
        return
    
    print(f"Found {challenges.count()} challenge(s) without slugs")
    print("-" * 50)
    
    for challenge in challenges:
        base_slug = slugify_title(challenge.title)
        slug = base_slug
        counter = 1
        
        # Ensure slug is unique
        while Challenge.objects.filter(slug=slug).exclude(id=challenge.id).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        challenge.slug = slug
        challenge.save()
        
        print(f"✓ {challenge.title}")
        print(f"  Slug: {slug}")
        print()
    
    print("-" * 50)
    print(f"✓ Generated slugs for {challenges.count()} challenge(s)")


if __name__ == '__main__':
    generate_slugs()
