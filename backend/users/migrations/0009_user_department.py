"""
Migration: Add department field to User model for HTP integration.
The register_number field now stores HTPID (no schema change needed for that).
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0008_rename_login_attem_ip_addr_8a9b2c_idx_login_attem_ip_addr_340a7c_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='department',
            field=models.CharField(
                blank=True,
                help_text="User's department (fetched from HTP)",
                max_length=255,
            ),
        ),
    ]
