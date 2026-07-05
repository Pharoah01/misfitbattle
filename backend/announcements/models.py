from django.db import models
from django.conf import settings
from django.utils import timezone


class Announcement(models.Model):
    TYPE_CHOICES = [
        ('info', 'Information'),
        ('warning', 'Warning'),
        ('success', 'Success'),
        ('urgent', 'Urgent'),
    ]

    title = models.CharField(max_length=200)
    message = models.TextField()
    announcement_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='info')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    is_pinned = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'announcements'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.announcement_type}] {self.title}"

    @property
    def is_expired(self):
        if self.expires_at and timezone.now() > self.expires_at:
            return True
        return False

    def save(self, *args, **kwargs):
        # Only one pinned announcement at a time
        if self.is_pinned:
            Announcement.objects.filter(is_pinned=True).exclude(pk=self.pk).update(is_pinned=False)
        super().save(*args, **kwargs)


class AnnouncementRead(models.Model):
    """Tracks which user read which announcement."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name='reads')
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'announcement_reads'
        unique_together = ['user', 'announcement']
