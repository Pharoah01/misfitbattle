from django.db.models import Max, Count, Min, Sum
from submissions.models import Submission
from django.contrib.auth import get_user_model

User = get_user_model()


def calculate_leaderboard():
    """
    Calculate leaderboard rankings based on:
    1. Total points (sum of max points per challenge)
    2. Earliest submission time (tiebreaker)
    
    Returns:
        list: Ranked user data with rank, register_number, name, 
              total_points, solved_count
    """
    user_challenge_points = (
        Submission.objects
        .values('user_id', 'challenge_id')
        .annotate(
            max_points=Max('challenge__points'),
            earliest_submission=Min('submitted_at')
        )
    )
    
    user_stats = {}
    for entry in user_challenge_points:
        user_id = entry['user_id']
        if user_id not in user_stats:
            user_stats[user_id] = {
                'total_points': 0,
                'solved_count': 0,
                'earliest_submission': entry['earliest_submission']
            }
        
        user_stats[user_id]['total_points'] += entry['max_points']
        user_stats[user_id]['solved_count'] += 1
        
        if entry['earliest_submission'] < user_stats[user_id]['earliest_submission']:
            user_stats[user_id]['earliest_submission'] = entry['earliest_submission']
    
    users = User.objects.filter(id__in=user_stats.keys())
    user_map = {u.id: u for u in users}
    
    leaderboard = []
    for user_id, stats in user_stats.items():
        user = user_map[user_id]
        leaderboard.append({
            'user_id': user_id,
            'htp_id': user.htp_id,
            'name': user.name,
            'total_points': stats['total_points'],
            'solved_count': stats['solved_count'],
            'earliest_submission': stats['earliest_submission']
        })
    
    leaderboard.sort(
        key=lambda x: (-x['total_points'], x['earliest_submission'])
    )
    
    for i, entry in enumerate(leaderboard, start=1):
        entry['rank'] = i
        del entry['earliest_submission']
        del entry['user_id']
    
    return leaderboard
