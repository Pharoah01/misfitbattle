"""
Rename register_number field to htp_id.
This renames the database column without losing data.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0009_user_department'),
    ]

    operations = [
        migrations.RenameField(
            model_name='user',
            old_name='register_number',
            new_name='htp_id',
        ),
    ]
