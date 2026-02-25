from django.db import models
from django.conf import settings


class Submission(models.Model):
    """
    User submission for a specific challenge.
    Stores sanitized HTML/CSS code.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submissions',
        db_index=True
    )
    challenge = models.ForeignKey(
        'challenges.Challenge',
        on_delete=models.CASCADE,
        related_name='submissions',
        db_index=True
    )
    html_code = models.TextField(max_length=10000)
    css_code = models.TextField(max_length=10000)
    code_length = models.IntegerField(
        help_text="Total character count of HTML + CSS"
    )
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        verbose_name = 'Submission'
        verbose_name_plural = 'Submissions'
        db_table = 'submissions'
        indexes = [
            models.Index(fields=['user', 'challenge']),
            models.Index(fields=['challenge']),
            models.Index(fields=['submitted_at']),
        ]
        ordering = ['-submitted_at']
    
    def save(self, *args, **kwargs):
        self.code_length = len(self.html_code) + len(self.css_code)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user.register_number} - {self.challenge.title}"

