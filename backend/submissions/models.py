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
    challenge = models.ForeignKey('challenges.Challenge',
        on_delete=models.CASCADE,
        related_name='submissions',
        db_index=True
    )
    html_code = models.TextField(max_length=10000)
    css_code = models.TextField(max_length=10000)
    code_length = models.IntegerField(
        help_text="Total character count of HTML + CSS"
    )
    rendered_image = models.ImageField(
        upload_to='submission_renders/',
        blank=True,
        null=True,
        help_text="Rendered PNG screenshot of submission"
    )
    similarity_score = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        blank=True,
        null=True,
        help_text="Similarity score from heatmap comparison (0.0-1.0)"
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
        ],
        default='pending',
        help_text="Current processing status of the submission"
    )
    error_message = models.TextField(
        blank=True,
        null=True,
        help_text="Error details if processing failed"
    )
    is_auto_save = models.BooleanField(
        default=False,
        help_text="True if auto-saved on session timeout, False if manually submitted"
    )
    submission_count = models.IntegerField(
        default=1,
        help_text="Number of times user has submitted (max 2 manual submissions)"
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
            models.Index(fields=['status']),
            models.Index(fields=['similarity_score']),
        ]
        ordering = ['-submitted_at']
    
    def save(self, *args, **kwargs):
        self.code_length = len(self.html_code) + len(self.css_code)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user.htp_id} - {self.challenge.title}"
