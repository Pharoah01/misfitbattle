"""
Security Models for IP Blocking and Incident Tracking
"""

from django.db import models
from django.utils import timezone
from datetime import timedelta
import json

class SecurityIncident(models.Model):
    """
    Track all security incidents for analysis and alerting
    """
    INCIDENT_TYPES = [
        ('SUSPICIOUS_PATTERN', 'Suspicious Pattern Detected'),
        ('SQL_INJECTION', 'SQL Injection Attempt'),
        ('PATH_TRAVERSAL', 'Path Traversal Attempt'),
        ('ENDPOINT_ENUMERATION', 'Endpoint Enumeration'),
        ('RATE_LIMIT_EXCEEDED', 'Rate Limit Exceeded'),
        ('AUTOMATED_TOOL', 'Automated Tool Detected'),
        ('INVALID_FINGERPRINT', 'Invalid Request Fingerprint'),
    ]
    
    SEVERITY_LEVELS = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    
    ip_address = models.GenericIPAddressField()
    incident_type = models.CharField(max_length=50, choices=INCIDENT_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS, default='MEDIUM')
    path = models.CharField(max_length=500)
    method = models.CharField(max_length=10)
    user_agent = models.TextField(blank=True)
    details = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)
    email_sent = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['ip_address', '-timestamp']),
            models.Index(fields=['incident_type', '-timestamp']),
            models.Index(fields=['severity', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.incident_type} from {self.ip_address} at {self.timestamp}"

class BlockedIP(models.Model):
    """
    Track blocked IP addresses with reasons and duration
    """
    BLOCK_REASONS = [
        ('MANUAL', 'Manually Blocked by Admin'),
        ('AUTO_SUSPICIOUS', 'Auto-blocked for Suspicious Activity'),
        ('AUTO_RATE_LIMIT', 'Auto-blocked for Rate Limiting'),
        ('AUTO_ATTACK', 'Auto-blocked for Attack Patterns'),
    ]
    
    ip_address = models.GenericIPAddressField(unique=True)
    reason = models.CharField(max_length=50, choices=BLOCK_REASONS)
    description = models.TextField(blank=True)
    blocked_at = models.DateTimeField(auto_now_add=True)
    blocked_until = models.DateTimeField(null=True, blank=True)
    is_permanent = models.BooleanField(default=False)
    blocked_by = models.CharField(max_length=100, default='System')  # Admin username or 'System'
    incident_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-blocked_at']
        indexes = [
            models.Index(fields=['ip_address']),
            models.Index(fields=['blocked_until']),
        ]
    
    def is_active(self):
        """Check if the block is currently active"""
        if self.is_permanent:
            return True
        if self.blocked_until and timezone.now() > self.blocked_until:
            return False
        return True
    
    def __str__(self):
        status = "Permanent" if self.is_permanent else f"Until {self.blocked_until}"
        return f"{self.ip_address} - {status}"


class SecurityAlert(models.Model):
    """
    Track sent security alerts to prevent spam
    """
    ALERT_TYPES = [
        ('INCIDENT', 'Security Incident Alert'),
        ('BLOCK', 'IP Block Notification'),
        ('SUMMARY', 'Daily Security Summary'),
    ]
    
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    recipient = models.EmailField()
    subject = models.CharField(max_length=200)
    incident = models.ForeignKey(SecurityIncident, on_delete=models.CASCADE, null=True, blank=True)
    blocked_ip = models.ForeignKey(BlockedIP, on_delete=models.CASCADE, null=True, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-sent_at']
    
    def __str__(self):
        return f"{self.alert_type} to {self.recipient} at {self.sent_at}"