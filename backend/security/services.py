"""
Security Services for Email Alerts and IP Management
"""

import logging
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.template.loader import render_to_string
from django.urls import reverse
from datetime import timedelta
from .models import SecurityIncident, BlockedIP, SecurityAlert
from .whatsapp_service import whatsapp_service

logger = logging.getLogger(__name__)

class SecurityAlertService:
    """
    Service for handling security alerts and notifications
    """
    
    def __init__(self):
        self.admin_email = getattr(settings, 'SECURITY_ADMIN_EMAIL', 'admin@example.com')
        self.from_email = getattr(settings, 'SECURITY_FROM_EMAIL', 'security@example.com')
        self.site_url = getattr(settings, 'SITE_URL', 'http://localhost:8000')
        
        # Alert thresholds
        self.alert_threshold = getattr(settings, 'SECURITY_ALERT_THRESHOLD', 3)
        self.auto_block_threshold = getattr(settings, 'SECURITY_AUTO_BLOCK_THRESHOLD', 5)
        self.block_duration_hours = getattr(settings, 'SECURITY_BLOCK_DURATION_HOURS', 24)
    
    def create_incident(self, ip_address, incident_type, severity, path, method, 
                       user_agent='', details=None):
        """
        Create a security incident and handle alerting
        """
        if details is None:
            details = {}
            
        incident = SecurityIncident.objects.create(
            ip_address=ip_address,
            incident_type=incident_type,
            severity=severity,
            path=path,
            method=method,
            user_agent=user_agent,
            details=details
        )
        
        # Check if we should send an alert
        self._check_and_send_alert(incident)
        
        # Check if we should auto-block the IP
        self._check_auto_block(ip_address)
        
        return incident
    
    def _check_and_send_alert(self, incident):
        """
        Check if an alert should be sent for this incident
        """
        # Count recent incidents from this IP
        recent_incidents = SecurityIncident.objects.filter(
            ip_address=incident.ip_address,
            timestamp__gte=timezone.now() - timedelta(hours=1)
        ).count()
        
        # Send alert if threshold is reached or for critical incidents
        should_alert = (
            recent_incidents >= self.alert_threshold or 
            incident.severity == 'CRITICAL' or
            incident.incident_type in ['SQL_INJECTION', 'PATH_TRAVERSAL']
        )
        
        if should_alert and not self._recent_alert_sent(incident.ip_address):
            # Send email alert
            self._send_incident_alert(incident)
            
            # Send WhatsApp alert
            try:
                whatsapp_service.send_security_incident_alert(incident)
            except Exception as e:
                logger.error(f"Failed to send WhatsApp alert: {e}")
    
    def _recent_alert_sent(self, ip_address, hours=1):
        """
        Check if an alert was recently sent for this IP
        """
        recent_alerts = SecurityAlert.objects.filter(
            alert_type='INCIDENT',
            incident__ip_address=ip_address,
            sent_at__gte=timezone.now() - timedelta(hours=hours)
        ).exists()
        
        return recent_alerts
    
    def _send_incident_alert(self, incident):
        """
        Send email alert for security incident
        """
        try:
            subject = f"🚨 Security Alert: {incident.get_incident_type_display()} from {incident.ip_address}"
            
            # Create email content
            context = {
                'incident': incident,
                'site_url': self.site_url,
                'block_url': f"{self.site_url}/admin/security/block-ip/{incident.ip_address}/",
                'incident_url': f"{self.site_url}/admin/security/securityincident/{incident.id}/change/",
            }
            
            message = f"""
Security Incident Detected

IP Address: {incident.ip_address}
Type: {incident.get_incident_type_display()}
Severity: {incident.get_severity_display()}
Path: {incident.path}
Method: {incident.method}
Time: {incident.timestamp}
User Agent: {incident.user_agent}

Quick Actions:
- Block IP: {context['block_url']}
- View Details: {context['incident_url']}
- Admin Panel: {self.site_url}/admin/security/

This is an automated security alert from your application.
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=self.from_email,
                recipient_list=[self.admin_email],
                fail_silently=False,
            )
            
            # Record that alert was sent
            SecurityAlert.objects.create(
                alert_type='INCIDENT',
                recipient=self.admin_email,
                subject=subject,
                incident=incident
            )
            
            incident.email_sent = True
            incident.save()
            
            logger.info(f"Security alert sent for incident {incident.id}")
            
        except Exception as e:
            logger.error(f"Failed to send security alert: {e}")
    
    def _check_auto_block(self, ip_address):
        """
        Check if IP should be auto-blocked based on incident count
        """
        # Don't auto-block if already blocked
        if BlockedIP.objects.filter(ip_address=ip_address).exists():
            return
        
        # Count incidents in the last hour
        recent_incidents = SecurityIncident.objects.filter(
            ip_address=ip_address,
            timestamp__gte=timezone.now() - timedelta(hours=1)
        ).count()
        
        if recent_incidents >= self.auto_block_threshold:
            self.block_ip(
                ip_address=ip_address,
                reason='AUTO_SUSPICIOUS',
                description=f'Auto-blocked after {recent_incidents} suspicious incidents',
                duration_hours=self.block_duration_hours,
                blocked_by='System'
            )
    
    def block_ip(self, ip_address, reason, description='', duration_hours=24, 
                 blocked_by='System', is_permanent=False):
        """
        Block an IP address
        """
        try:
            # Calculate block expiry
            blocked_until = None
            if not is_permanent and duration_hours:
                blocked_until = timezone.now() + timedelta(hours=duration_hours)
            
            # Get incident count for this IP
            incident_count = SecurityIncident.objects.filter(ip_address=ip_address).count()
            
            blocked_ip, created = BlockedIP.objects.get_or_create(
                ip_address=ip_address,
                defaults={
                    'reason': reason,
                    'description': description,
                    'blocked_until': blocked_until,
                    'is_permanent': is_permanent,
                    'blocked_by': blocked_by,
                    'incident_count': incident_count,
                }
            )
            
            if created:
                logger.warning(f"IP {ip_address} blocked by {blocked_by}: {description}")
                
                # Send email notification
                self._send_block_notification(blocked_ip)
                
                # Send WhatsApp notification
                try:
                    whatsapp_service.send_ip_block_alert(blocked_ip)
                except Exception as e:
                    logger.error(f"Failed to send WhatsApp block alert: {e}")
            
            return blocked_ip
            
        except Exception as e:
            logger.error(f"Failed to block IP {ip_address}: {e}")
            return None
    
    def _send_block_notification(self, blocked_ip):
        """
        Send notification when IP is blocked
        """
        try:
            subject = f"🔒 IP Blocked: {blocked_ip.ip_address}"
            
            duration = "Permanently" if blocked_ip.is_permanent else f"Until {blocked_ip.blocked_until}"
            
            message = f"""
IP Address Blocked

IP: {blocked_ip.ip_address}
Reason: {blocked_ip.get_reason_display()}
Description: {blocked_ip.description}
Duration: {duration}
Blocked by: {blocked_ip.blocked_by}
Incident Count: {blocked_ip.incident_count}

Manage blocked IPs: {self.site_url}/admin/security/blockedip/

This is an automated notification from your security system.
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=self.from_email,
                recipient_list=[self.admin_email],
                fail_silently=False,
            )
            
            # Record alert
            SecurityAlert.objects.create(
                alert_type='BLOCK',
                recipient=self.admin_email,
                subject=subject,
                blocked_ip=blocked_ip
            )
            
        except Exception as e:
            logger.error(f"Failed to send block notification: {e}")
    
    def unblock_ip(self, ip_address, unblocked_by='Admin'):
        """
        Unblock an IP address
        """
        try:
            blocked_ip = BlockedIP.objects.get(ip_address=ip_address)
            blocked_ip.delete()
            logger.info(f"IP {ip_address} unblocked by {unblocked_by}")
            return True
        except BlockedIP.DoesNotExist:
            return False
        except Exception as e:
            logger.error(f"Failed to unblock IP {ip_address}: {e}")
            return False
    
    def is_ip_blocked(self, ip_address):
        """
        Check if an IP address is currently blocked
        """
        try:
            blocked_ip = BlockedIP.objects.get(ip_address=ip_address)
            return blocked_ip.is_active()
        except BlockedIP.DoesNotExist:
            return False


# Global instance
security_service = SecurityAlertService()