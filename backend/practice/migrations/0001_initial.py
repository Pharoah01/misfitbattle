from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('challenges', '0008_challenge_is_released_is_locked'),
    ]

    operations = [
        migrations.CreateModel(
            name='PracticeSubmission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('html_code', models.TextField(max_length=10000)),
                ('css_code', models.TextField(max_length=10000)),
                ('code_length', models.IntegerField()),
                ('similarity_score', models.DecimalField(blank=True, decimal_places=4, max_digits=5, null=True)),
                ('rendered_image', models.ImageField(blank=True, null=True, upload_to='practice_renders/')),
                ('status', models.CharField(default='queued', max_length=20)),
                ('error_message', models.TextField(blank=True, null=True)),
                ('submitted_at', models.DateTimeField(auto_now_add=True)),
                ('challenge', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='practice_submissions', to='challenges.challenge')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='practice_submissions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'practice_submissions',
                'ordering': ['-submitted_at'],
            },
        ),
        migrations.CreateModel(
            name='OfficialSolution',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('html_code', models.TextField()),
                ('css_code', models.TextField()),
                ('published_at', models.DateTimeField(auto_now_add=True)),
                ('is_published', models.BooleanField(default=False)),
                ('challenge', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='official_solution', to='challenges.challenge')),
            ],
            options={
                'db_table': 'official_solutions',
            },
        ),
    ]
