
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_user_college_name_user_profile_completed'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Cryptographically secure session identifier', unique=True)),
                ('ip_address', models.GenericIPAddressField(help_text='IP address of the session')),
                ('user_agent', models.TextField(blank=True, help_text='Browser/device information')),
                ('country', models.CharField(blank=True, help_text='Country code from IP geolocation', max_length=2, null=True)),
                ('city', models.CharField(blank=True, help_text='City from IP geolocation', max_length=100, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_activity', models.DateTimeField(auto_now=True)),
                ('is_active', models.BooleanField(default=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='active_session', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'User Session',
                'verbose_name_plural': 'User Sessions',
                'db_table': 'user_sessions',
                'ordering': ['-last_activity'],
            },
        ),
        migrations.CreateModel(
            name='LoginAttempt',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('register_number', models.CharField(help_text='Register number used in login attempt', max_length=20)),
                ('ip_address', models.GenericIPAddressField()),
                ('user_agent', models.TextField(blank=True)),
                ('country', models.CharField(blank=True, max_length=2, null=True)),
                ('city', models.CharField(blank=True, max_length=100, null=True)),
                ('success', models.BooleanField(default=False)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='login_attempts', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Login Attempt',
                'verbose_name_plural': 'Login Attempts',
                'db_table': 'login_attempts',
                'ordering': ['-timestamp'],
            },
        ),
        migrations.CreateModel(
            name='SecurityAlert',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('alert_type', models.CharField(choices=[('suspicious_login', 'Suspicious Login Location'), ('multiple_accounts', 'Multiple Accounts Same IP'), ('rapid_login', 'Rapid Login Attempts'), ('session_hijack', 'Potential Session Hijacking')], max_length=20)),
                ('ip_address', models.GenericIPAddressField()),
                ('description', models.TextField()),
                ('severity', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')], default='medium', max_length=10)),
                ('resolved', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('resolved_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resolved_alerts', to=settings.AUTH_USER_MODEL)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='security_alerts', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Security Alert',
                'verbose_name_plural': 'Security Alerts',
                'db_table': 'security_alerts',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='IPMonitoring',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ip_address', models.GenericIPAddressField(unique=True)),
                ('user_count', models.PositiveIntegerField(default=0)),
                ('country', models.CharField(blank=True, max_length=2, null=True)),
                ('city', models.CharField(blank=True, max_length=100, null=True)),
                ('is_flagged', models.BooleanField(default=False, help_text='Flagged for suspicious activity')),
                ('first_seen', models.DateTimeField(auto_now_add=True)),
                ('last_seen', models.DateTimeField(auto_now=True)),
                ('users', models.ManyToManyField(related_name='monitored_ips', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'IP Monitoring',
                'verbose_name_plural': 'IP Monitoring',
                'db_table': 'ip_monitoring',
                'ordering': ['-user_count', '-last_seen'],
            },
        ),
        migrations.AddIndex(
            model_name='securityalert',
            index=models.Index(fields=['alert_type', 'resolved'], name='security_al_alert_t_b0c2c4_idx'),
        ),
        migrations.AddIndex(
            model_name='securityalert',
            index=models.Index(fields=['severity', 'resolved'], name='security_al_severit_4c4b8a_idx'),
        ),
        migrations.AddIndex(
            model_name='securityalert',
            index=models.Index(fields=['created_at'], name='security_al_created_c8b7a5_idx'),
        ),
        migrations.AddIndex(
            model_name='loginattempt',
            index=models.Index(fields=['ip_address', 'timestamp'], name='login_attem_ip_addr_8a9b2c_idx'),
        ),
        migrations.AddIndex(
            model_name='loginattempt',
            index=models.Index(fields=['register_number', 'timestamp'], name='login_attem_registe_7d4e5f_idx'),
        ),
        migrations.AddIndex(
            model_name='loginattempt',
            index=models.Index(fields=['success', 'timestamp'], name='login_attem_success_6c3d4e_idx'),
        ),
    ]