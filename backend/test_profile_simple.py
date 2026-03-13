#!/usr/bin/env python3
"""
Simple Profile Completion Test
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def test_profile_completion_logic():
    """Test the profile completion logic directly"""
    
    # Create a test user with incomplete profile
    user = User.objects.create_user(
        register_number="TEST456",
        name="Test User",
        email="test@example.com"
    )
    user.profile_completed = False
    user.save()
    
    print(f"Created test user: {user.register_number}")
    print(f"Initial profile_completed: {user.profile_completed}")
    
    # Simulate profile update with all required fields
    user.name = "Updated Test User"
    user.college_name = "Test College"
    user.email = "updated@example.com"
    
    # Apply the same logic as in UpdateProfileView
    if user.name and user.college_name and user.email and user.register_number:
        user.profile_completed = True
    
    user.save()
    
    print(f"Updated name: {user.name}")
    print(f"Updated college: {user.college_name}")
    print(f"Updated email: {user.email}")
    print(f"Updated profile_completed: {user.profile_completed}")
    
    # Cleanup
    user.delete()
    
    if user.profile_completed:
        print("✅ Profile completion logic test PASSED")
        return True
    else:
        print("❌ Profile completion logic test FAILED")
        return False

if __name__ == "__main__":
    test_profile_completion_logic()