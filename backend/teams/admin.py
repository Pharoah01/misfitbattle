from django.contrib import admin
from .models import Team


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'invite_code', 'leader', 'member', 'is_full', 'created_at']
    list_filter = ['is_full', 'created_at']
    search_fields = ['name', 'invite_code', 'leader__htp_id', 'member__htp_id']
    readonly_fields = ['invite_code', 'created_at']
