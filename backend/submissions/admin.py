from django.contrib import admin
from .models import Submission


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['user', 'challenge', 'code_length', 'submitted_at']
    list_filter = ['challenge', 'submitted_at']
    search_fields = ['user__register_number', 'user__name', 'challenge__title']
    ordering = ['-submitted_at']
    
    fieldsets = (
        ('Submission Info', {
            'fields': ('user', 'challenge', 'submitted_at')
        }),
        ('Code', {
            'fields': ('html_code', 'css_code', 'code_length')
        }),
    )
    
    readonly_fields = ['submitted_at', 'code_length']

