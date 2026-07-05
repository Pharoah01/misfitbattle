from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = [
        ('submission_queued', 'Submission Queued'),
        ('submission_scored', 'Submission Scored'),
        ('submission_failed', 'Submission Failed'),
        ('challenge_released', 'Challenge Released'),
        ('competition_pause', 'Competition Paused'),
        ('competition_resume', 'Competition Resumed'),
        ('competition_extend', 'Time Extended'),
        ('announcement', 'Announcement'),
        ('system', 'System'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=25, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.CharField(max_length=500)
    link = models.CharField(max_length=200, blank=True, help_text="Frontend route to navigate to")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.htp_id}: {self.title}"
