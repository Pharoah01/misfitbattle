#!/usr/bin/env python3
"""
Check WhatsApp Configuration
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings

def check_whatsapp_config():
    """Check WhatsApp configuration"""
    print("🔧 WhatsApp Configuration Check")
    print("=" * 50)
    
    print(f"WHATSAPP_ALERTS_ENABLED: {getattr(settings, 'WHATSAPP_ALERTS_ENABLED', 'NOT SET')}")
    print(f"WHATSAPP_API_PROVIDER: {getattr(settings, 'WHATSAPP_API_PROVIDER', 'NOT SET')}")
    print(f"WHATSAPP_ADMIN_NUMBERS: {getattr(settings, 'WHATSAPP_ADMIN_NUMBERS', 'NOT SET')}")
    print(f"WHATSAPP_ALERT_THRESHOLD: {getattr(settings, 'WHATSAPP_ALERT_THRESHOLD', 'NOT SET')}")
    
    print("\n🔑 Twilio Configuration:")
    twilio_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', 'NOT SET')
    twilio_token = getattr(settings, 'TWILIO_AUTH_TOKEN', 'NOT SET')
    twilio_number = getattr(settings, 'TWILIO_WHATSAPP_NUMBER', 'NOT SET')
    
    print(f"TWILIO_ACCOUNT_SID: {twilio_sid[:10]}... (hidden)" if twilio_sid != 'NOT SET' and len(twilio_sid) > 10 else f"TWILIO_ACCOUNT_SID: {twilio_sid}")
    print(f"TWILIO_AUTH_TOKEN: {twilio_token[:10]}... (hidden)" if twilio_token != 'NOT SET' and len(twilio_token) > 10 else f"TWILIO_AUTH_TOKEN: {twilio_token}")
    print(f"TWILIO_WHATSAPP_NUMBER: {twilio_number}")
    
    print("\n📋 Next Steps:")
    if not getattr(settings, 'WHATSAPP_ALERTS_ENABLED', False):
        print("❌ WhatsApp alerts are disabled")
    
    if not getattr(settings, 'WHATSAPP_ADMIN_NUMBERS', []):
        print("❌ No admin phone numbers configured")
    
    if twilio_sid == 'your_account_sid_here' or twilio_sid == 'NOT SET':
        print("❌ Twilio Account SID not configured")
        print("   👉 Get it from: https://console.twilio.com/ → Dashboard → Account Info")
    
    if twilio_token == 'your_auth_token_here' or twilio_token == 'NOT SET':
        print("❌ Twilio Auth Token not configured")
        print("   👉 Get it from: https://console.twilio.com/ → Dashboard → Account Info")
    
    # Check if all required settings are configured
    all_configured = (
        getattr(settings, 'WHATSAPP_ALERTS_ENABLED', False) and
        getattr(settings, 'WHATSAPP_ADMIN_NUMBERS', []) and
        twilio_sid not in ['your_account_sid_here', 'NOT SET', ''] and
        twilio_token not in ['your_auth_token_here', 'NOT SET', ''] and
        twilio_number not in ['NOT SET', '']
    )
    
    if all_configured:
        print("\n✅ Configuration looks complete! Run the test script:")
        print("   python test_whatsapp_alerts.py")
    else:
        print("\n⚠️  Configuration incomplete. Update your .env file with real credentials.")

if __name__ == "__main__":
    check_whatsapp_config()