"""
Session Security Models
Handles single active session per user, IP tracking, and security monitoring
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

try:
    from django.contrib.gis.geoip2 import GeoIP2
    GEOIP_AVAILABLE = True
except (ImportError, Exception) as e:
    GEOIP_AVAILABLE = False
    GeoIP2 = None
    logger.info(f"GeoIP2 not available: {e}. Geolocation features disabled.")

User = get_user_model()


class UserSession(models.Model):
    """
    Tracks active user sessions with security features
    Only one active session per user allowed
    """
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='active_session'
    )
    session_id = models.UUIDField(
        default=uuid.uuid4, 
        unique=True, 
        editable=False,
        help_text="Cryptographically secure session identifier"
    )
    ip_address = models.GenericIPAddressField(
        help_text="IP address of the session"
    )
    user_agent = models.TextField(
        blank=True,
        help_text="Browser/device information"
    )
    country = models.CharField(
        max_length=2, 
        blank=True, 
        null=True,
        help_text="Country code from IP geolocation"
    )
    city = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="City from IP geolocation"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    current_page = models.CharField(max_length=100, blank=True, default='', help_text="Current page/activity")
    
    class Meta:
        db_table = 'user_sessions'
        verbose_name = 'User Session'
        verbose_name_plural = 'User Sessions'
        ordering = ['-last_activity']

    def __str__(self):
        return f"{self.user.htp_id} - {self.ip_address} ({self.country})"

    def get_location_info(self):
        """Disabled - only IP logging is needed"""
        self.country = ''
        self.city = ''

    def is_session_expired(self, timeout_minutes=30):
        """Check if session has expired due to inactivity"""
        if not self.is_active:
            return True
        
        timeout = timezone.now() - timezone.timedelta(minutes=timeout_minutes)
        return self.last_activity < timeout

    def invalidate(self):
        """Invalidate this session"""
        self.is_active = False
        self.save(update_fields=['is_active'])


class LoginAttempt(models.Model):
    """
    Track login attempts for security monitoring
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='login_attempts'
    )
    register_number = models.CharField(
        max_length=20,
        help_text="Register number used in login attempt"
    )
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    country = models.CharField(max_length=2, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    success = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'login_attempts'
        verbose_name = 'Login Attempt'
        verbose_name_plural = 'Login Attempts'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['ip_address', 'timestamp']),
            models.Index(fields=['register_number', 'timestamp']),
            models.Index(fields=['success', 'timestamp']),
        ]

    def __str__(self):
        status = "SUCCESS" if self.success else "FAILED"
        return f"{self.register_number} - {self.ip_address} - {status}"

    def get_location_info(self):
        """Disabled - only IP logging is needed"""
        self.country = ''
        self.city = ''


class SecurityAlert(models.Model):
    """
    Security alerts for suspicious activities
    """
    ALERT_TYPES = [
        ('suspicious_login', 'Suspicious Login Location'),
        ('multiple_accounts', 'Multiple Accounts Same IP'),
        ('rapid_login', 'Rapid Login Attempts'),
        ('session_hijack', 'Potential Session Hijacking'),
    ]
    
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='security_alerts'
    )
    ip_address = models.GenericIPAddressField()
    description = models.TextField()
    severity = models.CharField(
        max_length=10,
        choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')],
        default='medium'
    )
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_alerts'
    )
    
    class Meta:
        db_table = 'security_alerts'
        verbose_name = 'Security Alert'
        verbose_name_plural = 'Security Alerts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['alert_type', 'resolved']),
            models.Index(fields=['severity', 'resolved']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.get_alert_type_display()} - {self.ip_address}"

    def resolve(self, resolved_by=None):
        """Mark alert as resolved"""
        self.resolved = True
        self.resolved_at = timezone.now()
        self.resolved_by = resolved_by
        self.save(update_fields=['resolved', 'resolved_at', 'resolved_by'])


class IPMonitoring(models.Model):
    """
    Monitor IP addresses for contest integrity
    """
    ip_address = models.GenericIPAddressField(unique=True)
    user_count = models.PositiveIntegerField(default=0)
    users = models.ManyToManyField(User, related_name='monitored_ips')
    country = models.CharField(max_length=2, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    is_flagged = models.BooleanField(
        default=False,
        help_text="Flagged for suspicious activity"
    )
    first_seen = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ip_monitoring'
        verbose_name = 'IP Monitoring'
        verbose_name_plural = 'IP Monitoring'
        ordering = ['-user_count', '-last_seen']

    def __str__(self):
        return f"{self.ip_address} ({self.user_count} users)"

    def get_location_info(self):
        """Disabled - only IP logging is needed"""
        self.country = ''
        self.city = ''

    def add_user(self, user):
        """Add user to this IP monitoring"""
        if not self.users.filter(id=user.id).exists():
            self.users.add(user)
            self.user_count = self.users.count()
            self.save(update_fields=['user_count'])
            
            if self.user_count > 1:
                self.is_flagged = True
                self.save(update_fields=['is_flagged'])
                
                SecurityAlert.objects.create(
                    alert_type='multiple_accounts',
                    ip_address=self.ip_address,
                    description=f"Multiple accounts ({self.user_count}) detected from IP {self.ip_address}",
                    severity='high'
                )