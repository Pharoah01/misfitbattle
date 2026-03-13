
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('challenges', '0006_alter_challenge_points_default'),
    ]

    operations = [
        migrations.AddField(
            model_name='challenge',
            name='difficulty',
            field=models.CharField(choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')], default='easy', help_text='Challenge difficulty level', max_length=10),
        ),
    ]
