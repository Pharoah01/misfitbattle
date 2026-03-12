"""
Django Admin for Security Management
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import path, reverse
from django.http import HttpResponseRedirect
from django.contrib import messages
from django.utils import timezone
from .models import SecurityIncident, BlockedIP, SecurityAlert
from .services import security_service

@admin.register(SecurityIncident)
class SecurityIncidentAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'ip_address', 'incident_type', 'severity', 'path', 'email_sent', 'action_buttons']
    list_filter = ['incident_type', 'severity', 'timestamp', 'email_sent']
    search_fields = ['ip_address', 'path', 'user_agent']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']
    
    def action_buttons(self, obj):
        block_url = reverse('admin:security_block_ip', args=[obj.ip_address])
        return format_html(
            '<a class="button" href="{}">Block IP</a>',
            block_url
        )
    action_buttons.short_description = 'Actions'
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('block-ip/<str:ip_address>/', self.admin_site.admin_view(self.block_ip_view), name='security_block_ip'),
        ]
        return custom_urls + urls
    
    def block_ip_view(self, request, ip_address):
        """Custom view to block an IP address"""
        blocked_ip = security_service.block_ip(
            ip_address=ip_address,
            reason='MANUAL',
            description=f'Manually blocked by {request.user.username}',
            blocked_by=request.user.username,
            duration_hours=24
        )
        
        if blocked_ip:
            messages.success(request, f'IP {ip_address} has been blocked successfully.')
        else:
            messages.error(request, f'Failed to block IP {ip_address}.')
        
        return HttpResponseRedirect(reverse('admin:security_securityincident_changelist'))

@admin.register(BlockedIP)
class BlockedIPAdmin(admin.ModelAdmin):
    list_display = ['ip_address', 'reason', 'blocked_at', 'blocked_until', 'is_permanent', 'blocked_by', 'incident_count', 'status', 'action_buttons']
    list_filter = ['reason', 'is_permanent', 'blocked_at']
    search_fields = ['ip_address', 'description']
    readonly_fields = ['blocked_at', 'incident_count']
    ordering = ['-blocked_at']
    
    def status(self, obj):
        if obj.is_active():
            return format_html('<span style="color: red;">Active</span>')
        else:
            return format_html('<span style="color: green;">Expired</span>')
    status.short_description = 'Status'
    
    def action_buttons(self, obj):
        if obj.is_active():
            unblock_url = reverse('admin:security_unblock_ip', args=[obj.ip_address])
            return format_html(
                '<a class="button" href="{}">Unblock</a>',
                unblock_url
            )
        return '-'
    action_buttons.short_description = 'Actions'
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('unblock-ip/<str:ip_address>/', self.admin_site.admin_view(self.unblock_ip_view), name='security_unblock_ip'),
        ]
        return custom_urls + urls
    
    def unblock_ip_view(self, request, ip_address):
        """Custom view to unblock an IP address"""
        success = security_service.unblock_ip(ip_address, request.user.username)
        
        if success:
            messages.success(request, f'IP {ip_address} has been unblocked successfully.')
        else:
            messages.error(request, f'Failed to unblock IP {ip_address}.')
        
        return HttpResponseRedirect(reverse('admin:security_blockedip_changelist'))

@admin.register(SecurityAlert)
class SecurityAlertAdmin(admin.ModelAdmin):
    list_display = ['sent_at', 'alert_type', 'recipient', 'subject']
    list_filter = ['alert_type', 'sent_at']
    search_fields = ['recipient', 'subject']
    readonly_fields = ['sent_at']
    ordering = ['-sent_at']