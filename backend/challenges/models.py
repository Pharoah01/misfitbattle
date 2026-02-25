from django.db import models


class Challenge(models.Model):
    """
    Coding challenge with HTML/CSS boilerplate.
    """
    title = models.CharField(max_length=255)
    description = models.TextField()
    html_boilerplate = models.TextField(
        help_text="Starting HTML code for participants"
    )
    css_boilerplate = models.TextField(
        help_text="Starting CSS code for participants"
    )
    points = models.IntegerField(
        default=100,
        help_text="Points awarded for solving this challenge"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Challenge'
        verbose_name_plural = 'Challenges'
        db_table = 'challenges'
        ordering = ['created_at']
    
    def __str__(self):
        return self.title

