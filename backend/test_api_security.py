#!/usr/bin/env python
"""
Test script to verify API authentication and user filtering
"""

import os
import django
import requests

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from submissions.models import Submission

User = get_user_model()

def test_api_authentication():
    """Test API authentication and user filtering"""
    
    print("=== API AUTHENTICATION TEST ===")
    
    # Get users and their tokens
    users = User.objects.all()
    
    for user in users:
        try:
            token = Token.objects.get(user=user)
            print(f"\nTesting User: {user.name} (ID: {user.id})")
            print(f"Token: {token.key[:10]}...")
            
            # Test API call
            headers = {
                'Authorization': f'Token {token.key}',
                'Content-Type': 'application/json'
            }
            
            try:
                response = requests.get(
                    'https://api.binarymisfits.info/api/submissions/',
                    headers=headers,
                    timeout=10
                )
                
                print(f"Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"Response type: {type(data)}")
                    print(f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                    print(f"Full response: {data}")
                    
                    if isinstance(data, list):
                        print(f"Submissions returned: {len(data)}")
                    elif isinstance(data, dict) and 'results' in data:
                        results = data['results']
                        print(f"Paginated submissions returned: {len(results) if isinstance(results, list) else 'Not a list'}")
                        if isinstance(results, list) and len(results) > 0:
                            print("First submission details:")
                            first_sub = results[0]
                            print(f"  Submission ID: {first_sub.get('id')}")
                            print(f"  User in response: {first_sub.get('user')}")
                            print(f"  Challenge: {first_sub.get('challenge_title')}")
                    else:
                        print(f"Unexpected response format: {data}")
                else:
                    print(f"Error: {response.text}")
                    
            except requests.exceptions.RequestException as e:
                print(f"Request failed: {e}")
                
        except Token.DoesNotExist:
            print(f"No token for user: {user.name}")
    
    print("\n=== DATABASE VERIFICATION ===")
    
    # Verify database state
    submissions = Submission.objects.all()
    print(f"Total submissions in database: {submissions.count()}")
    
    for sub in submissions:
        print(f"Submission {sub.id}: User {sub.user.id} ({sub.user.name}) -> {sub.challenge.title}")

if __name__ == '__main__':
    test_api_authentication()