from django.db import models
from django.conf import settings


class PracticeSubmission(models.Model):
    """Practice submissions — separate from competition. Unlimited attempts."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='practice_submissions')
    challenge = models.ForeignKey('challenges.Challenge', on_delete=models.CASCADE, related_name='practice_submissions')
    html_code = models.TextField(max_length=10000)
    css_code = models.TextField(max_length=10000)
    code_length = models.IntegerField()
    similarity_score = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    rendered_image = models.ImageField(upload_to='practice_renders/', blank=True, null=True)
    status = models.CharField(max_length=20, default='queued')
    error_message = models.TextField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'practice_submissions'
        ordering = ['-submitted_at']

    def save(self, *args, **kwargs):
        self.code_length = len(self.html_code) + len(self.css_code)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Practice: {self.user.htp_id} - {self.challenge.title}"


class OfficialSolution(models.Model):
    """Admin-published official solution for a challenge."""
    challenge = models.OneToOneField('challenges.Challenge', on_delete=models.CASCADE, related_name='official_solution')
    html_code = models.TextField()
    css_code = models.TextField()
    published_at = models.DateTimeField(auto_now_add=True)
    is_published = models.BooleanField(default=False)

    class Meta:
        db_table = 'official_solutions'

    def __str__(self):
        return f"Solution: {self.challenge.title}"
