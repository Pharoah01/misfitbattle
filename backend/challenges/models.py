from django.db import models
from django.core.exceptions import ValidationError
import re


def validate_palette(value):
    """
    Validate that palette is a comma-separated list of valid hex colors.
    Format: #RRGGBB,#RRGGBB,#RRGGBB
    """
    if not value:
        return
    
    colors = [c.strip() for c in value.split(',')]
    hex_pattern = re.compile(r'^#[0-9A-Fa-f]{6}$')
    
    for color in colors:
        if not hex_pattern.match(color):
            raise ValidationError(
                f'Invalid color format: {color}. Expected format: #RRGGBB (e.g., #FF5733)'
            )


class Challenge(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    html_boilerplate = models.TextField(
        help_text = "type your HTML code here."
    )
    css_boilerplate = models.TextField(
        help_text = "Type your CSS code here."
    )
    palette = models.CharField(
        max_length=500,
        blank=True,
        validators=[validate_palette],
        help_text="Comma-separated hex colors (e.g., #FF5733,#33FF57,#3357FF)"
    )
    preview_image = models.ImageField(
        upload_to='challenge_previews/',
        blank=True,
        null=True,
        help_text="Preview image for the challenge"
    )
    ground_truth_image = models.ImageField(
        upload_to='challenge_ground_truths/',
        blank=True,
        null=True,
        help_text="Reference image for heatmap comparison"
    )
    points = models.IntegerField(
        default=100,
        help_text = "Points Awarded!!"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Challenge"
        verbose_name_plural = "Challenge"
        db_table = 'challenges'
        ordering = ['created_at']

    def __str__(self):
        return self.title
    
    def clean(self):
        """Additional model-level validation"""
        super().clean()
        if self.palette:
            validate_palette(self.palette)
