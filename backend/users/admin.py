from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import User
from .session_models import UserSession, LoginAttempt, SecurityAlert, IPMonitoring


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['htp_id', 'name', 'email', 'college_name', 'profile_completed', 'is_admin', 'is_staff', 'is_superuser', 'created_at', 'session_status']
    list_filter = ['is_admin', 'is_staff', 'is_superuser', 'is_active', 'profile_completed']
    search_fields = ['htp_id', 'name', 'email', 'college_name']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('htp_id', 'password')}),
        ('Personal info', {'fields': ('name', 'email', 'college_name', 'department', 'profile_completed')}),
        ('Permissions', {
            'fields': ('is_admin', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'description': 'Note: Only users with is_staff=True and is_superuser=True can access Django admin panel.'
        }),
        ('Important dates', {'fields': ('last_login', 'created_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('htp_id', 'name', 'email', 'college_name', 'department', 'password1', 'password2', 'is_admin'),
        }),
    )
    
    readonly_fields = ['created_at']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(id=request.user.id)

    def session_status(self, obj):
        try:
            session = UserSession.objects.get(user=obj, is_active=True)
            return format_html(
                '<span style="color: green;">Active</span><br>'
                '<small>{} ({})</small>',
                session.ip_address,
                session.country or 'Unknown'
            )
        except UserSession.DoesNotExist:
            return format_html('<span style="color: red;">No Active Session</span>')
    session_status.short_description = 'Session Status'


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ('user_info', 'ip_address', 'location', 'created_at', 'last_activity', 'is_active', 'session_actions')
    list_filter = ('is_active', 'country', 'created_at')
    search_fields = ('user__htp_id', 'user__name', 'ip_address')
    ordering = ('-last_activity',)
    readonly_fields = ('session_id', 'created_at')
    
    def user_info(self, obj):
        return format_html(
            '<strong>{}</strong><br><small>{}</small>',
            obj.user.htp_id,
            obj.user.name
        )
    user_info.short_description = 'User'
    
    def location(self, obj):
        if obj.country or obj.city:
            return f"{obj.city or 'Unknown'}, {obj.country or 'Unknown'}"
        return 'Unknown'
    location.short_description = 'Location'
    
    def session_actions(self, obj):
        if obj.is_active:
            return format_html(
                '<span style="color: red; cursor: pointer;">'
                'Force Logout</span>'
            )
        return 'Inactive'
    session_actions.short_description = 'Actions'


@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ('register_number', 'ip_address', 'location', 'success_status', 'timestamp')
    list_filter = ('success', 'country', 'timestamp')
    search_fields = ('register_number', 'ip_address')
    ordering = ('-timestamp',)
    readonly_fields = ('timestamp',)
    
    def location(self, obj):
        if obj.country or obj.city:
            return f"{obj.city or 'Unknown'}, {obj.country or 'Unknown'}"
        return 'Unknown'
    location.short_description = 'Location'
    
    def success_status(self, obj):
        if obj.success:
            return format_html('<span style="color: green; font-weight: bold;">SUCCESS</span>')
        else:
            return format_html('<span style="color: red; font-weight: bold;">FAILED</span>')
    success_status.short_description = 'Status'


@admin.register(SecurityAlert)
class SecurityAlertAdmin(admin.ModelAdmin):
    list_display = ('alert_type', 'user_info', 'ip_address', 'severity_display', 'resolved_status', 'created_at')
    list_filter = ('alert_type', 'severity', 'resolved', 'created_at')
    search_fields = ('user__htp_id', 'ip_address', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
    
    def user_info(self, obj):
        if obj.user:
            return format_html(
                '<strong>{}</strong><br><small>{}</small>',
                obj.user.htp_id,
                obj.user.name
            )
        return 'Unknown User'
    user_info.short_description = 'User'
    
    def severity_display(self, obj):
        colors = {'low': 'green', 'medium': 'orange', 'high': 'red'}
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.severity, 'black'),
            obj.severity.upper()
        )
    severity_display.short_description = 'Severity'
    
    def resolved_status(self, obj):
        if obj.resolved:
            return format_html(
                '<span style="color: green;">Resolved</span><br>'
                '<small>by {}</small>',
                obj.resolved_by.htp_id if obj.resolved_by else 'System'
            )
        else:
            return format_html('<span style="color: red; font-weight: bold;">OPEN</span>')
    resolved_status.short_description = 'Status'


@admin.register(IPMonitoring)
class IPMonitoringAdmin(admin.ModelAdmin):
    list_display = ('ip_address', 'user_count', 'location', 'flagged_status', 'first_seen', 'last_seen', 'user_list')
    list_filter = ('is_flagged', 'country', 'user_count')
    search_fields = ('ip_address',)
    ordering = ('-user_count', '-last_seen')
    
    def location(self, obj):
        if obj.country or obj.city:
            return f"{obj.city or 'Unknown'}, {obj.country or 'Unknown'}"
        return 'Unknown'
    location.short_description = 'Location'
    
    def flagged_status(self, obj):
        if obj.is_flagged:
            return format_html('<span style="color: red; font-weight: bold;">FLAGGED</span>')
        else:
            return format_html('<span style="color: green;">Normal</span>')
    flagged_status.short_description = 'Status'
    
    def user_list(self, obj):
        users = obj.users.all()[:5]
        user_links = []
        for user in users:
            user_links.append(f"{user.htp_id} ({user.name})")
        
        result = '<br>'.join(user_links)
        if obj.user_count > 5:
            result += f"<br><small>... and {obj.user_count - 5} more</small>"
        
        return format_html(result)
    user_list.short_description = 'Users'
