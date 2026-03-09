from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['register_number', 'name', 'email', 'college_name', 'profile_completed', 'is_admin', 'is_staff', 'is_superuser', 'created_at']
    list_filter = ['is_admin', 'is_staff', 'is_superuser', 'is_active', 'profile_completed']
    search_fields = ['register_number', 'name', 'email', 'college_name']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('register_number', 'password')}),
        ('Personal info', {'fields': ('name', 'email', 'college_name', 'profile_completed')}),
        ('Permissions', {
            'fields': ('is_admin', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'description': 'Note: Only users with is_staff=True and is_superuser=True can access Django admin panel. Regular users (is_staff=False) can only access API endpoints.'
        }),
        ('Important dates', {'fields': ('last_login', 'created_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('register_number', 'name', 'email', 'college_name', 'password1', 'password2', 'is_admin'),
            'description': 'Creating a regular user (not superuser). They will NOT have access to Django admin panel.'
        }),
    )
    
    readonly_fields = ['created_at']
    
    def get_queryset(self, request):
        """Only superusers can see all users in admin."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(id=request.user.id)

