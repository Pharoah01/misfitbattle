"""
WhatsApp Security Alert Service
Sends security incidents and IP blocking notifications to WhatsApp
"""

import requests
import logging
from django.conf import settings
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class WhatsAppSecurityService:
    """
    Service for sending security alerts to WhatsApp
    Supports multiple WhatsApp API providers
    """
    
    def __init__(self):
        self.api_provider = getattr(settings, 'WHATSAPP_API_PROVIDER', 'twilio')  # 'twilio', 'whatsapp_business', 'ultramsg'
        self.enabled = getattr(settings, 'WHATSAPP_ALERTS_ENABLED', False)
        
        self.twilio_account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
        self.twilio_auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
        self.twilio_whatsapp_number = getattr(settings, 'TWILIO_WHATSAPP_NUMBER', '')
        
        self.whatsapp_token = getattr(settings, 'WHATSAPP_ACCESS_TOKEN', '')
        self.whatsapp_phone_id = getattr(settings, 'WHATSAPP_PHONE_NUMBER_ID', '')
        
        self.ultramsg_token = getattr(settings, 'ULTRAMSG_TOKEN', '')
        self.ultramsg_instance_id = getattr(settings, 'ULTRAMSG_INSTANCE_ID', '')
        
        self.admin_numbers = getattr(settings, 'WHATSAPP_ADMIN_NUMBERS', [])
        
        self.alert_threshold = getattr(settings, 'WHATSAPP_ALERT_THRESHOLD', 3)
        self.critical_incidents = ['SQL_INJECTION', 'PATH_TRAVERSAL', 'AUTOMATED_TOOL']
    
    def send_security_incident_alert(self, incident):
        """
        Send WhatsApp alert for security incident
        """
        if not self.enabled or not self.admin_numbers:
            return False
        
        if not self._should_send_alert(incident):
            return False
        
        message = self._format_incident_message(incident)
        
        success = True
        for phone_number in self.admin_numbers:
            if not self._send_message(phone_number, message):
                success = False
        
        return success
    
    def send_ip_block_alert(self, blocked_ip):
        """
        Send WhatsApp alert for IP blocking
        """
        if not self.enabled or not self.admin_numbers:
            return False
        
        message = self._format_block_message(blocked_ip)
        
        success = True
        for phone_number in self.admin_numbers:
            if not self._send_message(phone_number, message):
                success = False
        
        return success
    
    def send_daily_summary(self, summary_data):
        """
        Send daily security summary to WhatsApp
        """
        if not self.enabled or not self.admin_numbers:
            return False
        
        message = self._format_daily_summary(summary_data)
        
        success = True
        for phone_number in self.admin_numbers:
            if not self._send_message(phone_number, message):
                success = False
        
        return success
    
    def _should_send_alert(self, incident):
        """
        Determine if incident should trigger WhatsApp alert
        """
        if incident.incident_type in self.critical_incidents:
            return True
        
        if incident.severity in ['HIGH', 'CRITICAL']:
            return True
        
        from .models import SecurityIncident
        from datetime import timedelta
        from django.utils import timezone
        
        recent_count = SecurityIncident.objects.filter(
            ip_address=incident.ip_address,
            timestamp__gte=timezone.now() - timedelta(hours=1)
        ).count()
        
        return recent_count >= self.alert_threshold
    
    def _format_incident_message(self, incident):
        """
        Format security incident for WhatsApp message
        """
        severity_emoji = {
            'LOW': '🟡',
            'MEDIUM': '🟠', 
            'HIGH': '🔴',
            'CRITICAL': '🚨'
        }
        
        incident_emoji = {
            'SQL_INJECTION': '💉',
            'PATH_TRAVERSAL': '📁',
            'AUTOMATED_TOOL': '🤖',
            'ENDPOINT_ENUMERATION': '🔍',
            'SUSPICIOUS_PATTERN': '⚠️'
        }
        
        emoji = severity_emoji.get(incident.severity, '⚠️')
        type_emoji = incident_emoji.get(incident.incident_type, '🔒')
        
        message = f"""🛡️ *SECURITY ALERT* {emoji}

{type_emoji} *{incident.get_incident_type_display()}*
📍 IP: `{incident.ip_address}`
🎯 Path: `{incident.path}`
📊 Severity: *{incident.get_severity_display()}*
🕐 Time: {incident.timestamp.strftime('%Y-%m-%d %H:%M:%S')}
🌐 User Agent: `{incident.user_agent[:50]}...`

🔗 Admin Panel: https://api.binarymisfits.info/admin/security/
⚡ Block IP: Use /block_ip_{incident.ip_address.replace('.', '_')}"""

        return message
    
    def _format_block_message(self, blocked_ip):
        """
        Format IP block notification for WhatsApp
        """
        if blocked_ip.is_permanent or blocked_ip.blocked_until is None:
            duration = "Permanent"
        else:
            duration = f"Until {blocked_ip.blocked_until.strftime('%Y-%m-%d %H:%M')}"
        
        blocked_at_str = "Unknown"
        if hasattr(blocked_ip, 'blocked_at') and blocked_ip.blocked_at:
            blocked_at_str = blocked_ip.blocked_at.strftime('%Y-%m-%d %H:%M:%S')
        
        message = f"""🔒 *IP BLOCKED*

🚫 IP: `{blocked_ip.ip_address}`
📋 Reason: *{blocked_ip.get_reason_display()}*
⏰ Duration: {duration}
👤 Blocked by: {blocked_ip.blocked_by}
📊 Incidents: {blocked_ip.incident_count}
🕐 Blocked at: {blocked_at_str}

📝 Description: {blocked_ip.description}

🔗 Manage: https://api.binarymisfits.info/admin/security/blockedip/"""

        return message
    
    def _format_daily_summary(self, summary_data):
        """
        Format daily security summary
        """
        message = f"""📊 *DAILY SECURITY SUMMARY*
📅 Date: {datetime.now().strftime('%Y-%m-%d')}

🚨 Total Incidents: {summary_data.get('total_incidents', 0)}
🔴 Critical: {summary_data.get('critical_incidents', 0)}
🟠 High: {summary_data.get('high_incidents', 0)}
🟡 Medium: {summary_data.get('medium_incidents', 0)}

🚫 IPs Blocked: {summary_data.get('blocked_ips', 0)}
🤖 Bot Attacks: {summary_data.get('bot_attacks', 0)}
💉 SQL Injections: {summary_data.get('sql_injections', 0)}

🔗 Full Report: https://api.binarymisfits.info/admin/security/"""

        return message
    
    def _send_message(self, phone_number, message):
        """
        Send message via configured WhatsApp API provider
        """
        try:
            if self.api_provider == 'twilio':
                return self._send_via_twilio(phone_number, message)
            elif self.api_provider == 'whatsapp_business':
                return self._send_via_whatsapp_business(phone_number, message)
            elif self.api_provider == 'ultramsg':
                return self._send_via_ultramsg(phone_number, message)
            else:
                logger.error(f"Unknown WhatsApp API provider: {self.api_provider}")
                return False
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message: {e}")
            return False
    
    def _send_via_twilio(self, phone_number, message):
        """
        Send message via Twilio WhatsApp API
        """
        if not all([self.twilio_account_sid, self.twilio_auth_token, self.twilio_whatsapp_number]):
            logger.error("Twilio WhatsApp credentials not configured")
            return False
        
        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_account_sid}/Messages.json"
        
        data = {
            'From': f'whatsapp:{self.twilio_whatsapp_number}',
            'To': f'whatsapp:{phone_number}',
            'Body': message
        }
        
        response = requests.post(
            url,
            data=data,
            auth=(self.twilio_account_sid, self.twilio_auth_token)
        )
        
        if response.status_code == 201:
            logger.info(f"WhatsApp message sent successfully to {phone_number}")
            return True
        else:
            logger.error(f"Failed to send WhatsApp message: {response.text}")
            return False
    
    def _send_via_whatsapp_business(self, phone_number, message):
        """
        Send message via WhatsApp Business API
        """
        if not all([self.whatsapp_token, self.whatsapp_phone_id]):
            logger.error("WhatsApp Business API credentials not configured")
            return False
        
        url = f"https://graph.facebook.com/v18.0/{self.whatsapp_phone_id}/messages"
        
        headers = {
            'Authorization': f'Bearer {self.whatsapp_token}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'messaging_product': 'whatsapp',
            'to': phone_number.replace('+', ''),
            'type': 'text',
            'text': {'body': message}
        }
        
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            logger.info(f"WhatsApp message sent successfully to {phone_number}")
            return True
        else:
            logger.error(f"Failed to send WhatsApp message: {response.text}")
            return False
    
    def _send_via_ultramsg(self, phone_number, message):
        """
        Send message via UltraMsg API (Alternative provider)
        """
        if not all([self.ultramsg_token, self.ultramsg_instance_id]):
            logger.error("UltraMsg credentials not configured")
            return False
        
        url = f"https://api.ultramsg.com/{self.ultramsg_instance_id}/messages/chat"
        
        data = {
            'token': self.ultramsg_token,
            'to': phone_number,
            'body': message
        }
        
        response = requests.post(url, data=data)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('sent'):
                logger.info(f"WhatsApp message sent successfully to {phone_number}")
                return True
        
        logger.error(f"Failed to send WhatsApp message: {response.text}")
        return False

whatsapp_service = WhatsAppSecurityService()