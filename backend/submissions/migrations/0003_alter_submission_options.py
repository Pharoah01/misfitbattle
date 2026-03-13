
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('submissions', '0002_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='submission',
            options={'ordering': ['-submitted_at'], 'verbose_name': 'Submission', 'verbose_name_plural': 'Submissions'},
        ),
    ]
