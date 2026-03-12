# Challenge Admin - Difficulty Levels Feature
from django.contrib import admin
from .models import Challenge


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ['title', 'difficulty', 'points', 'palette', 'created_at']
    list_filter = ['difficulty', 'points', 'created_at']
    search_fields = ['title', 'description']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'difficulty', 'points')
        }),
        ('Code Templates', {
            'fields': ('html_boilerplate', 'css_boilerplate')
        }),
        ('Visual Assets', {
            'fields': ('palette', 'preview_image'),
            'description': 'Palette format: #RRGGBB,#RRGGBB (e.g., #FF5733,#33FF57)'
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at']

