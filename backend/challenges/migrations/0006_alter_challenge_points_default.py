
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('challenges', '0005_update_challenge_points_system'),
    ]

    operations = [
        migrations.AlterField(
            model_name='challenge',
            name='points',
            field=models.IntegerField(default=10, help_text='Points Awarded!! (Easy: 10, Medium: 20, Hard: 30)'),
        ),
    ]