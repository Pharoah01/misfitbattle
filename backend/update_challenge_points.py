#!/usr/bin/env python
"""
Script to update challenge points based on difficulty levels
Easy: 10 points, Medium: 20 points, Hard: 30 points
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

def update_challenge_points():
    """Update challenge points based on difficulty levels"""
    
    # Define the new point system
    DIFFICULTY_POINTS = {
        'easy': 10,
        'medium': 20,
        'hard': 30
    }
    
    challenges = Challenge.objects.all()
    updated_count = 0
    
    for challenge in challenges:
        old_points = challenge.points
        new_points = DIFFICULTY_POINTS.get(challenge.difficulty, 10)  # Default to 10 if difficulty not found
        
        if old_points != new_points:
            challenge.points = new_points
            challenge.save()
            updated_count += 1
            print(f"Updated '{challenge.title}': {challenge.difficulty} -> {old_points} to {new_points} points")
        else:
            print(f"'{challenge.title}': {challenge.difficulty} -> {old_points} points (no change needed)")
    
    print(f"\nSummary:")
    print(f"- Total challenges: {challenges.count()}")
    print(f"- Updated challenges: {updated_count}")
    print(f"- No changes needed: {challenges.count() - updated_count}")
    
    # Show final distribution
    print(f"\nFinal point distribution:")
    for difficulty, points in DIFFICULTY_POINTS.items():
        count = Challenge.objects.filter(difficulty=difficulty).count()
        print(f"- {difficulty.capitalize()}: {count} challenges × {points} points each")

if __name__ == '__main__':
    print("Updating challenge points based on difficulty levels...")
    print("New point system: Easy=10, Medium=20, Hard=30")
    print("-" * 50)
    update_challenge_points()
    print("-" * 50)
    print("Done!")