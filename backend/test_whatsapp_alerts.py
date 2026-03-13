#!/usr/bin/env python3
"""
Test WhatsApp Security Alerts
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from security.whatsapp_service import whatsapp_service
from security.models import SecurityIncident, BlockedIP
from django.contrib.auth import get_user_model

User = get_user_model()

def test_whatsapp_configuration():
    """Test WhatsApp service configuration"""
    print("🔧 Testing WhatsApp Configuration...")
    print(f"Enabled: {whatsapp_service.enabled}")
    print(f"Provider: {whatsapp_service.api_provider}")
    print(f"Admin Numbers: {whatsapp_service.admin_numbers}")
    
    if not whatsapp_service.enabled:
        print("❌ WhatsApp alerts are disabled. Enable in settings.")
        return False
    
    if not whatsapp_service.admin_numbers:
        print("❌ No admin phone numbers configured.")
        return False
    
    print("✅ Configuration looks good!")
    return True

def test_incident_alert():
    """Test security incident WhatsApp alert"""
    print("\n📱 Testing Security Incident Alert...")
    
    # Create a test incident
    incident = SecurityIncident.objects.create(
        ip_address="192.168.1.100",
        incident_type="SQL_INJECTION",
        severity="CRITICAL",
        path="/api/test/",
        method="POST",
        user_agent="Test User Agent",
        details={"test": "WhatsApp alert test"}
    )
    
    try:
        success = whatsapp_service.send_security_incident_alert(incident)
        if success:
            print("✅ Security incident alert sent successfully!")
        else:
            print("❌ Failed to send security incident alert")
        
        # Cleanup
        incident.delete()
        return success
        
    except Exception as e:
        print(f"❌ Error sending incident alert: {e}")
        incident.delete()
        return False

def test_block_alert():
    """Test IP block WhatsApp alert"""
    print("\n🚫 Testing IP Block Alert...")
    
    # Create a test blocked IP
    blocked_ip = BlockedIP.objects.create(
        ip_address="192.168.1.101",
        reason="MANUAL",
        description="Test WhatsApp block alert",
        blocked_by="Test Script",
        incident_count=5
    )
    
    try:
        success = whatsapp_service.send_ip_block_alert(blocked_ip)
        if success:
            print("✅ IP block alert sent successfully!")
        else:
            print("❌ Failed to send IP block alert")
        
        # Cleanup
        blocked_ip.delete()
        return success
        
    except Exception as e:
        print(f"❌ Error sending block alert: {e}")
        blocked_ip.delete()
        return False

def test_daily_summary():
    """Test daily summary WhatsApp message"""
    print("\n📊 Testing Daily Summary...")
    
    summary_data = {
        'total_incidents': 25,
        'critical_incidents': 3,
        'high_incidents': 8,
        'medium_incidents': 14,
        'blocked_ips': 5,
        'bot_attacks': 12,
        'sql_injections': 3,
    }
    
    try:
        success = whatsapp_service.send_daily_summary(summary_data)
        if success:
            print("✅ Daily summary sent successfully!")
        else:
            print("❌ Failed to send daily summary")
        
        return success
        
    except Exception as e:
        print(f"❌ Error sending daily summary: {e}")
        return False

def main():
    """Run all WhatsApp tests"""
    print("🚀 WhatsApp Security Alerts Test Suite")
    print("=" * 50)
    
    # Test configuration
    if not test_whatsapp_configuration():
        print("\n❌ Configuration test failed. Please check your settings.")
        return
    
    # Test incident alert
    incident_success = test_incident_alert()
    
    # Test block alert
    block_success = test_block_alert()
    
    # Test daily summary
    summary_success = test_daily_summary()
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 Test Results Summary:")
    print(f"Security Incident Alert: {'✅ PASS' if incident_success else '❌ FAIL'}")
    print(f"IP Block Alert: {'✅ PASS' if block_success else '❌ FAIL'}")
    print(f"Daily Summary: {'✅ PASS' if summary_success else '❌ FAIL'}")
    
    if all([incident_success, block_success, summary_success]):
        print("\n🎉 All tests passed! WhatsApp alerts are working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check your WhatsApp API configuration.")

if __name__ == "__main__":
    main()