from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import teams.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Team',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('invite_code', models.CharField(default=teams.models.generate_invite_code, help_text='6-character code to join this team', max_length=6, unique=True)),
                ('is_full', models.BooleanField(default=False, help_text='True when both members have joined')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('leader', models.ForeignKey(help_text='User who created the team', on_delete=django.db.models.deletion.CASCADE, related_name='led_teams', to=settings.AUTH_USER_MODEL)),
                ('member', models.ForeignKey(blank=True, help_text='Second team member who joined via invite code', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='joined_teams', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Team',
                'verbose_name_plural': 'Teams',
                'db_table': 'teams',
                'ordering': ['-created_at'],
            },
        ),
    ]
