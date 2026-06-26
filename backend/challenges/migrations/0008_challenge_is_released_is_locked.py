from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('challenges', '0007_challenge_difficulty'),
    ]

    operations = [
        migrations.AddField(
            model_name='challenge',
            name='is_released',
            field=models.BooleanField(default=True, help_text='Whether challenge is visible to participants'),
        ),
        migrations.AddField(
            model_name='challenge',
            name='is_locked',
            field=models.BooleanField(default=False, help_text='When True, no new submissions accepted for this challenge'),
        ),
    ]
