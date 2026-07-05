from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('submissions', '0007_competitionstate'),
    ]

    operations = [
        migrations.AlterField(
            model_name='submission',
            name='status',
            field=models.CharField(
                choices=[('queued', 'Queued'), ('rendering', 'Rendering'), ('scoring', 'Scoring'), ('completed', 'Completed'), ('failed', 'Failed')],
                default='queued',
                help_text='Current processing status of the submission',
                max_length=20,
            ),
        ),
    ]
