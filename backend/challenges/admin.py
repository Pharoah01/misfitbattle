from django.contrib import admin
from django.utils.html import format_html
from .models import Challenge


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ['title', 'difficulty', 'points', 'slug', 'release_status', 'lock_status', 'created_at']
    list_filter = ['difficulty', 'is_released', 'is_locked', 'points']
    search_fields = ['title', 'description', 'slug']
    ordering = ['difficulty', 'created_at']
    list_editable = ['is_released', 'is_locked']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'description', 'difficulty', 'points')
        }),
        ('Visibility', {
            'fields': ('is_released', 'is_locked'),
            'description': 'Control challenge visibility and submission access.'
        }),
        ('Code Templates', {
            'fields': ('html_boilerplate', 'css_boilerplate')
        }),
        ('Visual Assets', {
            'fields': ('palette', 'preview_image', 'ground_truth_image'),
            'description': 'Palette format: #RRGGBB,#RRGGBB'
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'slug']
    actions = ['release_challenges', 'hide_challenges', 'lock_challenges', 'unlock_challenges']

    def release_status(self, obj):
        if obj.is_released:
            return format_html('<span style="color:#10B981; font-weight:bold;">Released</span>')
        return format_html('<span style="color:#F59E0B; font-weight:bold;">Hidden</span>')
    release_status.short_description = 'Visibility'

    def lock_status(self, obj):
        if obj.is_locked:
            return format_html('<span style="color:#EF4444; font-weight:bold;">Locked</span>')
        return format_html('<span style="color:#10B981;">Open</span>')
    lock_status.short_description = 'Submissions'

    @admin.action(description='Release selected challenges')
    def release_challenges(self, request, queryset):
        count = queryset.update(is_released=True)
        self.message_user(request, f'{count} challenge(s) released.')

    @admin.action(description='Hide selected challenges')
    def hide_challenges(self, request, queryset):
        count = queryset.update(is_released=False)
        self.message_user(request, f'{count} challenge(s) hidden.')

    @admin.action(description='Lock selected challenges')
    def lock_challenges(self, request, queryset):
        count = queryset.update(is_locked=True)
        self.message_user(request, f'{count} challenge(s) locked.')

    @admin.action(description='Unlock selected challenges')
    def unlock_challenges(self, request, queryset):
        count = queryset.update(is_locked=False)
        self.message_user(request, f'{count} challenge(s) unlocked.')
