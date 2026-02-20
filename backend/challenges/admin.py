from django.contrib import admin
from .models import Challenge


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ['title', 'points', 'created_at']
    list_filter = ['points', 'created_at']
    search_fields = ['title', 'description']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'points')
        }),
        ('Code Templates', {
            'fields': ('html_boilerplate', 'css_boilerplate')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at']

