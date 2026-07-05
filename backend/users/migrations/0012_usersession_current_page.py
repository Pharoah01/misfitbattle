from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0010_rename_register_number_to_htp_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='usersession',
            name='current_page',
            field=models.CharField(blank=True, default='', help_text='Current page/activity', max_length=100),
        ),
    ]
