#!/usr/bin/env python
"""
Test script for difficulty feature
Run this after deployment to verify everything works
"""

import os
import sys
import django
import requests

# Add the project directory to Python path
sys.path.append('/opt/misfitbattle/backend')

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Setup Django
django.setup()

from challenges.models import Challenge
from challenges.serializers import ChallengeSerializer

def test_model():
    """Test the model changes"""
    print("=== Testing Model ===")
    
    # Check if difficulty field exists
    challenge = Challenge.objects.first()
    if challenge:
        print(f"✅ Challenge model has difficulty field: {challenge.difficulty}")
        print(f"   Challenge: {challenge.title} - Difficulty: {challenge.difficulty}")
    else:
        print("❌ No challenges found in database")
    
    # Test difficulty choices
    choices = dict(Challenge.DIFFICULTY_CHOICES)
    print(f"✅ Available difficulty choices: {list(choices.keys())}")

def test_serializer():
    """Test the serializer changes"""
    print("\n=== Testing Serializer ===")
    
    challenge = Challenge.objects.first()
    if challenge:
        serializer = ChallengeSerializer(challenge)
        data = serializer.data
        
        if 'difficulty' in data:
            print(f"✅ Serializer includes difficulty field: {data['difficulty']}")
        else:
            print("❌ Serializer missing difficulty field")
            
        print(f"   Serialized fields: {list(data.keys())}")
    else:
        print("❌ No challenges found for serializer test")

def test_api_endpoints():
    """Test API endpoints"""
    print("\n=== Testing API Endpoints ===")
    
    base_url = "https://api.binarymisfits.info"  # Change if different
    
    try:
        # Test list endpoint
        response = requests.get(f"{base_url}/api/challenges/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            
            # Handle paginated response
            if isinstance(data, dict) and 'results' in data:
                results = data['results']
                print(f"✅ API returned paginated response with {len(results)} challenges")
                
                if len(results) > 0:
                    first_challenge = results[0]
                    if 'difficulty' in first_challenge:
                        print(f"✅ API includes difficulty field: {first_challenge['difficulty']}")
                        print(f"   Challenge: {first_challenge.get('title', 'Unknown')}")
                        print(f"   Points: {first_challenge.get('points', 'Unknown')}")
                    else:
                        print("❌ API missing difficulty field")
                        print(f"   Available fields: {list(first_challenge.keys())}")
                else:
                    print("⚠️  API returned empty results")
            elif isinstance(data, list):
                print(f"✅ API returned list with {len(data)} challenges")
                if len(data) > 0 and 'difficulty' in data[0]:
                    print(f"✅ API includes difficulty field: {data[0]['difficulty']}")
            else:
                print(f"❌ Unexpected API response format: {type(data)}")
        else:
            print(f"❌ API list endpoint failed: {response.status_code}")
        
        # Test filtering
        response = requests.get(f"{base_url}/api/challenges/?difficulty=easy", timeout=10)
        if response.status_code == 200:
            filter_data = response.json()
            if isinstance(filter_data, dict) and 'results' in filter_data:
                count = len(filter_data['results'])
                print(f"✅ Difficulty filtering works (returned {count} easy challenges)")
            else:
                print("✅ Difficulty filtering works")
        else:
            print(f"❌ Difficulty filtering failed: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ API test failed: {e}")
        print("   (This is normal if running locally)")

def main():
    print("Testing Challenge Difficulty Feature")
    print("=" * 40)
    
    test_model()
    test_serializer()
    test_api_endpoints()
    
    print("\n" + "=" * 40)
    print("Test completed!")

if __name__ == '__main__':
    main()