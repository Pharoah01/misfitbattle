from django.contrib import admin
from .models import Submission


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['get_user_register_number', 'get_user_name', 'get_user_email', 'challenge', 'code_length', 'submitted_at']
    list_filter = ['challenge', 'submitted_at', 'status']
    search_fields = ['user__register_number', 'user__name', 'user__email', 'challenge__title']
    ordering = ['-submitted_at']
    
    fieldsets = (
        ('Submission Info', {
            'fields': ('user', 'challenge', 'status', 'submitted_at')
        }),
        ('Code', {
            'fields': ('html_code', 'css_code', 'code_length')
        }),
        ('Processing Results', {
            'fields': ('rendered_image', 'similarity_score', 'error_message')
        }),
    )
    
    readonly_fields = ['submitted_at', 'code_length', 'rendered_image', 'similarity_score']
    
    def get_user_register_number(self, obj):
        return obj.user.register_number
    get_user_register_number.short_description = 'Register Number'
    get_user_register_number.admin_order_field = 'user__register_number'
    
    def get_user_name(self, obj):
        return obj.user.name
    get_user_name.short_description = 'Name'
    get_user_name.admin_order_field = 'user__name'
    
    def get_user_email(self, obj):
        return obj.user.email or 'Not provided'
    get_user_email.short_description = 'Email'
    get_user_email.admin_order_field = 'user__email'

