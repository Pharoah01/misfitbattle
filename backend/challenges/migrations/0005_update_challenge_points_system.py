
from django.db import migrations

def update_challenge_points(apps, schema_editor):
    """Update challenge points based on difficulty levels"""
    Challenge = apps.get_model('challenges', 'Challenge')
    
    DIFFICULTY_POINTS = {
        'easy': 10,
        'medium': 20,
        'hard': 30
    }
    
    for challenge in Challenge.objects.all():
        new_points = DIFFICULTY_POINTS.get(challenge.difficulty, 10)
        challenge.points = new_points
        challenge.save()

def reverse_challenge_points(apps, schema_editor):
    """Reverse the points update (set back to 100)"""
    Challenge = apps.get_model('challenges', 'Challenge')
    
    for challenge in Challenge.objects.all():
        challenge.points = 100
        challenge.save()

class Migration(migrations.Migration):

    dependencies = [
        ('challenges', '0004_challenge_slug'),
    ]

    operations = [
        migrations.RunPython(update_challenge_points, reverse_challenge_points),
    ]