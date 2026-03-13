#!/usr/bin/env python3
"""
Test IP Block Fix
"""

import os
import sys
import django
from datetime import datetime
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from security.whatsapp_service import whatsapp_service
from security.models import BlockedIP

def test_ip_block_formatting():
    """Test IP block message formatting"""
    print("🧪 Testing IP Block Message Formatting...")
    
    # Create a test blocked IP with proper timestamps
    blocked_ip = BlockedIP(
        ip_address="192.168.1.101",
        reason="MANUAL",
        description="Test IP block formatting",
        blocked_by="Test Script",
        incident_count=5,
        is_permanent=True,
        blocked_until=None,  # This was causing the error
        blocked_at=timezone.now()  # Add proper timestamp
    )
    
    try:
        message = whatsapp_service._format_block_message(blocked_ip)
        print("✅ IP block message formatting works!")
        print("\n📱 Sample message:")
        print(message)
        return True
        
    except Exception as e:
        print(f"❌ Error in IP block formatting: {e}")
        return False

if __name__ == "__main__":
    test_ip_block_formatting()