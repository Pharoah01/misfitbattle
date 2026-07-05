from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('submissions', '0006_remove_submission_unique_user_challenge_submission_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='CompetitionState',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('state', models.CharField(choices=[('active', 'Active'), ('paused', 'Paused'), ('ended', 'Ended')], default='active', max_length=10)),
                ('paused_at', models.DateTimeField(blank=True, null=True)),
                ('resumed_at', models.DateTimeField(blank=True, null=True)),
                ('total_paused_seconds', models.IntegerField(default=0, help_text='Cumulative paused duration in seconds')),
                ('total_extended_seconds', models.IntegerField(default=0, help_text='Cumulative extension in seconds')),
            ],
            options={
                'db_table': 'competition_state',
                'verbose_name': 'Competition State',
            },
        ),
    ]
