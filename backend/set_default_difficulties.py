#!/usr/bin/env python
"""
Script to set default difficulty levels for existing challenges
Run this after applying the migration
"""

import os
import sys
import django

# Add the project directory to Python path
sys.path.append('/opt/misfitbattle/backend')

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Setup Django
django.setup()

from challenges.models import Challenge

def set_default_difficulties():
    """Set default difficulty levels based on points"""
    challenges = Challenge.objects.all()
    
    for challenge in challenges:
        # Set difficulty based on points (you can adjust these thresholds)
        if challenge.points <= 100:
            challenge.difficulty = 'easy'
        elif challenge.points <= 200:
            challenge.difficulty = 'medium'
        else:
            challenge.difficulty = 'hard'
        
        challenge.save()
        print(f"Updated {challenge.title}: {challenge.points} points -> {challenge.difficulty}")
    
    print(f"\nUpdated {challenges.count()} challenges with default difficulty levels")

if __name__ == '__main__':
    print("Setting default difficulty levels for existing challenges...")
    set_default_difficulties()
    print("Done!")