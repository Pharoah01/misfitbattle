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
    """Set default difficulty levels and points based on new system"""
    
    # Define the new point system
    DIFFICULTY_POINTS = {
        'easy': 10,
        'medium': 20,
        'hard': 30
    }
    
    challenges = Challenge.objects.all()
    
    for challenge in challenges:
        # Set difficulty based on current points (legacy logic)
        if challenge.points <= 50:
            challenge.difficulty = 'easy'
        elif challenge.points <= 150:
            challenge.difficulty = 'medium'
        else:
            challenge.difficulty = 'hard'
        
        # Update points to match new system
        old_points = challenge.points
        challenge.points = DIFFICULTY_POINTS[challenge.difficulty]
        
        challenge.save()
        print(f"Updated {challenge.title}: {old_points} -> {challenge.points} points ({challenge.difficulty})")
    
    print(f"\nUpdated {challenges.count()} challenges with new difficulty levels and points")
    print("New point system: Easy=10, Medium=20, Hard=30")

if __name__ == '__main__':
    print("Setting default difficulty levels for existing challenges...")
    set_default_difficulties()
    print("Done!")