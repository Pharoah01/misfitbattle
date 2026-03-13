
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('challenges', '0003_challenge_ground_truth_image'),
    ]

    operations = [
        migrations.AddField(
            model_name='challenge',
            name='slug',
            field=models.SlugField(blank=True, help_text="URL-friendly identifier (e.g., 'center-square')", max_length=255, null=True, unique=True),
        ),
    ]
