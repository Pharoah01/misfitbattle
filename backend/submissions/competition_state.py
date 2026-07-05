"""
Competition State Manager
Handles pause/resume with time tracking.
Stored in DB for instant state changes without server restart.
"""

from django.db import models
from django.utils import timezone
from django.core.cache import cache


class CompetitionState(models.Model):
    """Singleton model — only one row exists."""
    STATE_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('ended', 'Ended'),
    ]

    state = models.CharField(max_length=10, choices=STATE_CHOICES, default='active')
    paused_at = models.DateTimeField(null=True, blank=True)
    resumed_at = models.DateTimeField(null=True, blank=True)
    total_paused_seconds = models.IntegerField(default=0, help_text="Cumulative paused duration in seconds")

    class Meta:
        db_table = 'competition_state'
        verbose_name = 'Competition State'

    def __str__(self):
        return f"Competition: {self.state}"

    @classmethod
    def get(cls):
        """Get or create the singleton state."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def pause(self):
        """Pause the competition."""
        if self.state == 'paused':
            return
        self.state = 'paused'
        self.paused_at = timezone.now()
        self.save(update_fields=['state', 'paused_at'])
        cache.delete('competition_state')

    def resume(self):
        """Resume the competition. Accumulates paused duration."""
        if self.state != 'paused':
            return
        if self.paused_at:
            duration = (timezone.now() - self.paused_at).total_seconds()
            self.total_paused_seconds += int(duration)
        self.state = 'active'
        self.resumed_at = timezone.now()
        self.paused_at = None
        self.save(update_fields=['state', 'resumed_at', 'paused_at', 'total_paused_seconds'])
        cache.delete('competition_state')

    @classmethod
    def is_paused(cls):
        """Quick check if competition is paused."""
        cached = cache.get('competition_state')
        if cached is not None:
            return cached == 'paused'
        obj = cls.get()
        cache.set('competition_state', obj.state, timeout=5)
        return obj.state == 'paused'

    @classmethod
    def get_total_paused_seconds(cls):
        """Get total paused duration for timer adjustment."""
        obj = cls.get()
        total = obj.total_paused_seconds
        # If currently paused, add ongoing pause duration
        if obj.state == 'paused' and obj.paused_at:
            total += int((timezone.now() - obj.paused_at).total_seconds())
        return total
