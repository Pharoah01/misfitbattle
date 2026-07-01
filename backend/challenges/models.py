from django.db import models
from django.core.exceptions import ValidationError
import re


def validate_palette(value):
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
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    title = models.CharField(max_length=255)
    slug = models.SlugField(
        max_length=255,
        unique=True,
        blank=True,
        null=True,
        help_text="URL-friendly identifier (e.g., 'center-square')"
    )
    description = models.TextField()
    html_boilerplate = models.TextField(help_text="type your HTML code here.")
    css_boilerplate = models.TextField(help_text="Type your CSS code here.")
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
    points = models.IntegerField(default=50, help_text="Points Awarded (Easy: 50, Medium: 100, Hard: 150)")
    difficulty = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CHOICES,
        default='easy',
        help_text="Challenge difficulty level"
    )
    is_released = models.BooleanField(
        default=False,
        help_text="Whether challenge is visible to participants"
    )
    is_locked = models.BooleanField(
        default=False,
        help_text="When True, no new submissions accepted for this challenge"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Challenge"
        verbose_name_plural = "Challenge"
        db_table = 'challenges'
        ordering = ['created_at']

    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        # Auto-generate slug from title if not set
        if not self.slug:
            import re
            base_slug = re.sub(r'[^a-z0-9]+', '-', self.title.lower()).strip('-')
            slug = base_slug
            counter = 1
            while Challenge.objects.filter(slug=slug).exclude(id=self.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)
    
    def clean(self):
        super().clean()
        if self.palette:
            validate_palette(self.palette)
