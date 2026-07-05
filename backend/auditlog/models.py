from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    EVENT_TYPES = [
        ('auth.login', 'Login'),
        ('auth.logout', 'Logout'),
        ('auth.login_failed', 'Login Failed'),
        ('auth.register', 'Registration'),
        ('team.create', 'Team Created'),
        ('team.join', 'Team Join'),
        ('team.leave', 'Team Leave'),
        ('team.solo', 'Team Solo'),
        ('competition.start', 'Competition Start'),
        ('competition.pause', 'Competition Pause'),
        ('competition.resume', 'Competition Resume'),
        ('competition.end', 'Competition End'),
        ('competition.extend', 'Time Extension'),
        ('challenge.release', 'Challenge Released'),
        ('challenge.hide', 'Challenge Hidden'),
        ('challenge.lock', 'Challenge Locked'),
        ('challenge.unlock', 'Challenge Unlocked'),
        ('submission.create', 'Submission Created'),
        ('submission.rejudge', 'Submission Rejudged'),
        ('leaderboard.freeze', 'Leaderboard Frozen'),
        ('leaderboard.unfreeze', 'Leaderboard Unfrozen'),
        ('announcement.create', 'Announcement Created'),
        ('announcement.delete', 'Announcement Deleted'),
        ('admin.action', 'Admin Action'),
        ('security.incident', 'Security Incident'),
        ('security.ip_block', 'IP Blocked'),
    ]

    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, db_index=True
    )
    team_name = models.CharField(max_length=100, blank=True, db_index=True)
    challenge_title = models.CharField(max_length=255, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    description = models.TextField()
    before_value = models.TextField(blank=True)
    after_value = models.TextField(blank=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['event_type', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
        ]

    def __str__(self):
        return f"[{self.event_type}] {self.description}"
