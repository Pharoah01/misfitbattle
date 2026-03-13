
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_alter_user_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='college_name',
            field=models.CharField(blank=True, help_text="User's college or institution", max_length=255),
        ),
        migrations.AddField(
            model_name='user',
            name='profile_completed',
            field=models.BooleanField(default=False, help_text='Whether user has completed profile information'),
        ),
    ]
