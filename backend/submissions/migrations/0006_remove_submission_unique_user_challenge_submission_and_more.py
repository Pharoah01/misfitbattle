
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('submissions', '0005_submission_unique_user_challenge_submission'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='submission',
            name='unique_user_challenge_submission',
        ),
        migrations.AddField(
            model_name='submission',
            name='is_auto_save',
            field=models.BooleanField(default=False, help_text='True if auto-saved on session timeout, False if manually submitted'),
        ),
        migrations.AddField(
            model_name='submission',
            name='submission_count',
            field=models.IntegerField(default=1, help_text='Number of times user has submitted (max 2 manual submissions)'),
        ),
    ]
