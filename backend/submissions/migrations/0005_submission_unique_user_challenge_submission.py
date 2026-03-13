
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('submissions', '0004_submission_error_message_submission_rendered_image_and_more'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='submission',
            constraint=models.UniqueConstraint(fields=('user', 'challenge'), name='unique_user_challenge_submission'),
        ),
    ]
