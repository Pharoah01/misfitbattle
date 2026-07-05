from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('challenges', '0008_challenge_is_released_is_locked'),
        ('teams', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ChallengeClaim',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('claimed_at', models.DateTimeField(auto_now_add=True)),
                ('challenge', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='challenges.challenge')),
                ('team', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='claims', to='teams.team')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'challenge_claims',
                'unique_together': {('team', 'challenge')},
            },
        ),
        migrations.CreateModel(
            name='TeamActivity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('activity_type', models.CharField(choices=[('join', 'Member Joined'), ('submit', 'Challenge Submitted'), ('scored', 'Challenge Scored'), ('claim', 'Challenge Claimed'), ('release', 'Challenge Released')], max_length=20)),
                ('description', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('team', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='activities', to='teams.team')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'team_activities',
                'ordering': ['-created_at'],
            },
        ),
    ]
