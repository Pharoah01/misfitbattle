#!/usr/bin/env python3
"""
IP Blocking Script for Security Management
Interactive script to manually block IP addresses
"""

import os
import sys
import django
from datetime import datetime, timedelta
import ipaddress

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from security.models import SecurityIncident, BlockedIP
from security.services import security_service


def validate_ip(ip_string):
    """Validate IP address format"""
    try:
        ipaddress.ip_address(ip_string)
        return True
    except ValueError:
        return False


def get_incident_summary(ip_address):
    """Get summary of incidents for an IP"""
    incidents = SecurityIncident.objects.filter(ip_address=ip_address).order_by('-timestamp')
    
    if not incidents.exists():
        return "No security incidents found for this IP."
    
    summary = f"\n📊 Security Incidents for {ip_address}:\n"
    summary += "=" * 50 + "\n"
    
    # Count by type
    incident_types = {}
    for incident in incidents:
        incident_types[incident.incident_type] = incident_types.get(incident.incident_type, 0) + 1
    
    summary += f"Total Incidents: {incidents.count()}\n"
    summary += f"First Incident: {incidents.last().timestamp}\n"
    summary += f"Latest Incident: {incidents.first().timestamp}\n\n"
    
    summary += "Incident Types:\n"
    for incident_type, count in incident_types.items():
        display_name = dict(SecurityIncident.INCIDENT_TYPES).get(incident_type, incident_type)
        summary += f"  • {display_name}: {count}\n"
    
    summary += "\nRecent Incidents (last 5):\n"
    for incident in incidents[:5]:
        summary += f"  • {incident.timestamp.strftime('%Y-%m-%d %H:%M')} - {incident.get_incident_type_display()} ({incident.get_severity_display()})\n"
        summary += f"    Path: {incident.path}\n"
    
    return summary


def check_existing_block(ip_address):
    """Check if IP is already blocked"""
    try:
        blocked_ip = BlockedIP.objects.get(ip_address=ip_address)
        if blocked_ip.is_active():
            duration = "Permanent" if blocked_ip.is_permanent else f"Until {blocked_ip.blocked_until}"
            return f"""
⚠️  IP {ip_address} is already BLOCKED!

Block Details:
  • Status: ACTIVE
  • Reason: {blocked_ip.get_reason_display()}
  • Description: {blocked_ip.description}
  • Duration: {duration}
  • Blocked by: {blocked_ip.blocked_by}
  • Blocked at: {blocked_ip.blocked_at}
"""
        else:
            return f"IP {ip_address} was previously blocked but the block has expired."
    except BlockedIP.DoesNotExist:
        return None


def main():
    print("🔒 IP Blocking Security Tool")
    print("=" * 40)
    
    while True:
        # Get IP address from user
        ip_address = input("\nEnter IP address to block (or 'quit' to exit): ").strip()
        
        if ip_address.lower() in ['quit', 'exit', 'q']:
            print("👋 Goodbye!")
            break
        
        # Validate IP format
        if not validate_ip(ip_address):
            print("❌ Invalid IP address format. Please enter a valid IPv4 or IPv6 address.")
            continue
        
        # Check if already blocked
        existing_block = check_existing_block(ip_address)
        if existing_block:
            print(existing_block)
            
            # Ask if user wants to continue anyway
            choice = input("Do you want to update the block? (y/n): ").strip().lower()
            if choice not in ['y', 'yes']:
                continue
        
        # Show incident summary
        print(get_incident_summary(ip_address))
        
        # Get block details
        print("\n🔧 Block Configuration:")
        print("1. Temporary (24 hours)")
        print("2. Temporary (7 days)")
        print("3. Temporary (30 days)")
        print("4. Permanent")
        print("5. Custom duration")
        
        duration_choice = input("\nSelect duration (1-5): ").strip()
        
        # Set duration based on choice
        is_permanent = False
        duration_hours = 24
        
        if duration_choice == "1":
            duration_hours = 24
        elif duration_choice == "2":
            duration_hours = 24 * 7
        elif duration_choice == "3":
            duration_hours = 24 * 30
        elif duration_choice == "4":
            is_permanent = True
            duration_hours = None
        elif duration_choice == "5":
            try:
                duration_hours = int(input("Enter duration in hours: "))
                if duration_hours <= 0:
                    print("❌ Duration must be positive.")
                    continue
            except ValueError:
                print("❌ Invalid duration. Please enter a number.")
                continue
        else:
            print("❌ Invalid choice. Using default 24 hours.")
            duration_hours = 24
        
        # Get reason
        print("\nBlock Reasons:")
        print("1. Manual - Suspicious Activity")
        print("2. Manual - Attack Patterns")
        print("3. Manual - Policy Violation")
        print("4. Manual - Other")
        
        reason_choice = input("Select reason (1-4): ").strip()
        
        reason_map = {
            "1": "MANUAL",
            "2": "MANUAL", 
            "3": "MANUAL",
            "4": "MANUAL"
        }
        
        reason = reason_map.get(reason_choice, "MANUAL")
        
        # Get description
        description = input("Enter block description (optional): ").strip()
        if not description:
            if reason_choice == "1":
                description = "Manually blocked for suspicious activity"
            elif reason_choice == "2":
                description = "Manually blocked for attack patterns"
            elif reason_choice == "3":
                description = "Manually blocked for policy violation"
            else:
                description = "Manually blocked by administrator"
        
        # Confirm block
        print(f"\n📋 Block Summary:")
        print(f"IP Address: {ip_address}")
        print(f"Duration: {'Permanent' if is_permanent else f'{duration_hours} hours'}")
        print(f"Reason: {reason}")
        print(f"Description: {description}")
        
        confirm = input("\nConfirm block? (y/n): ").strip().lower()
        
        if confirm in ['y', 'yes']:
            try:
                # Block the IP
                blocked_ip = security_service.block_ip(
                    ip_address=ip_address,
                    reason=reason,
                    description=description,
                    duration_hours=duration_hours,
                    blocked_by="Admin-Script",
                    is_permanent=is_permanent
                )
                
                if blocked_ip:
                    print(f"✅ Successfully blocked IP {ip_address}")
                    
                    # Show final status
                    if is_permanent:
                        print(f"   Duration: Permanent")
                    else:
                        expiry = datetime.now() + timedelta(hours=duration_hours)
                        print(f"   Expires: {expiry.strftime('%Y-%m-%d %H:%M:%S')}")
                    
                    print(f"   Description: {description}")
                else:
                    print(f"❌ Failed to block IP {ip_address}")
                    
            except Exception as e:
                print(f"❌ Error blocking IP: {e}")
        else:
            print("❌ Block cancelled.")
        
        # Ask if user wants to block another IP
        another = input("\nBlock another IP? (y/n): ").strip().lower()
        if another not in ['y', 'yes']:
            break
    
    print("\n🔒 IP blocking session completed.")


if __name__ == "__main__":
    main()