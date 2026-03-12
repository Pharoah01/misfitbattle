#!/usr/bin/env python3
"""
Blocked IP Management Script
View, unblock, and manage blocked IP addresses
"""

import os
import sys
import django
from datetime import datetime

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from security.models import BlockedIP
from security.services import security_service


def list_blocked_ips():
    """List all blocked IPs"""
    blocked_ips = BlockedIP.objects.all().order_by('-blocked_at')
    
    if not blocked_ips.exists():
        print("📋 No blocked IPs found.")
        return
    
    print(f"📋 Blocked IPs ({blocked_ips.count()} total):")
    print("=" * 80)
    
    for i, blocked_ip in enumerate(blocked_ips, 1):
        status = "🔴 ACTIVE" if blocked_ip.is_active() else "🟢 EXPIRED"
        duration = "Permanent" if blocked_ip.is_permanent else f"Until {blocked_ip.blocked_until}"
        
        print(f"{i}. {blocked_ip.ip_address} - {status}")
        print(f"   Reason: {blocked_ip.get_reason_display()}")
        print(f"   Duration: {duration}")
        print(f"   Description: {blocked_ip.description}")
        print(f"   Blocked by: {blocked_ip.blocked_by}")
        print(f"   Incidents: {blocked_ip.incident_count}")
        print(f"   Blocked at: {blocked_ip.blocked_at}")
        print("-" * 40)


def unblock_ip():
    """Unblock an IP address"""
    ip_address = input("Enter IP address to unblock: ").strip()
    
    try:
        blocked_ip = BlockedIP.objects.get(ip_address=ip_address)
        
        print(f"\n📋 Block Details for {ip_address}:")
        print(f"Status: {'ACTIVE' if blocked_ip.is_active() else 'EXPIRED'}")
        print(f"Reason: {blocked_ip.get_reason_display()}")
        print(f"Description: {blocked_ip.description}")
        print(f"Blocked by: {blocked_ip.blocked_by}")
        print(f"Blocked at: {blocked_ip.blocked_at}")
        
        confirm = input(f"\nConfirm unblock {ip_address}? (y/n): ").strip().lower()
        
        if confirm in ['y', 'yes']:
            if security_service.unblock_ip(ip_address, "Admin-Script"):
                print(f"✅ Successfully unblocked {ip_address}")
            else:
                print(f"❌ Failed to unblock {ip_address}")
        else:
            print("❌ Unblock cancelled.")
            
    except BlockedIP.DoesNotExist:
        print(f"❌ IP {ip_address} is not blocked.")


def main():
    print("🔧 Blocked IP Management Tool")
    print("=" * 40)
    
    while True:
        print("\nOptions:")
        print("1. List all blocked IPs")
        print("2. Unblock an IP")
        print("3. Check if IP is blocked")
        print("4. Quit")
        
        choice = input("\nSelect option (1-4): ").strip()
        
        if choice == "1":
            list_blocked_ips()
        elif choice == "2":
            unblock_ip()
        elif choice == "3":
            ip_address = input("Enter IP address to check: ").strip()
            is_blocked = security_service.is_ip_blocked(ip_address)
            print(f"IP {ip_address} is {'🔴 BLOCKED' if is_blocked else '🟢 NOT BLOCKED'}")
        elif choice == "4":
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please select 1-4.")


if __name__ == "__main__":
    main()