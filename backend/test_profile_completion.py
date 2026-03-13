#!/usr/bin/env python3
"""
Test Profile Completion Flow
"""

import os
import sys
import django
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from rest_framework.authtoken.models import Token
from users.views import UpdateProfileView

User = get_user_model()

def test_profile_completion():
    """Test that profile completion works correctly"""
    
    # Create a test user with incomplete profile
    user = User.objects.create_user(
        register_number="TEST123",
        name="Test User",
        email="test@example.com"
    )
    user.profile_completed = False
    user.save()
    
    print(f"Created test user: {user.register_number}")
    print(f"Initial profile_completed: {user.profile_completed}")
    
    # Create a token for the user
    token, created = Token.objects.get_or_create(user=user)
    
    # Create a proper DRF API request
    factory = APIRequestFactory()
    request = factory.put('/api/auth/update-profile/', {
        'name': 'Updated Test User',
        'college_name': 'Test College',
        'email': 'updated@example.com'
    }, format='json')
    
    # Authenticate the request
    request.user = user
    
    # Test the update profile view
    view = UpdateProfileView()
    response = view.put(request)
    
    print(f"Response status: {response.status_code}")
    print(f"Response data: {response.data}")
    
    # Refresh user from database
    user.refresh_from_db()
    print(f"Updated profile_completed: {user.profile_completed}")
    print(f"Updated name: {user.name}")
    print(f"Updated college: {user.college_name}")
    print(f"Updated email: {user.email}")
    
    # Cleanup
    token.delete()
    user.delete()
    
    if user.profile_completed:
        print("✅ Profile completion test PASSED")
        return True
    else:
        print("❌ Profile completion test FAILED")
        return False

if __name__ == "__main__":
    test_profile_completion()