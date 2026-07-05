"""
Team-based leaderboard with similarity-based scoring.

Scoring:
  score_per_challenge = similarity_score × challenge_points
  team_total = sum of scores across all submitted challenges

Only completed submissions with a valid similarity_score count.
Tiebreaker: team with earliest last submission wins.
"""

from submissions.models import Submission
from teams.models import Team
from decimal import Decimal


def calculate_leaderboard():
    """
    Calculate team-based leaderboard with pixel-match scoring.
    
    Returns:
        list of dicts: rank, team_name, members, total_score,
        challenges_solved, last_submission_time
    """
    teams = Team.objects.select_related('leader', 'member').all()
    
    leaderboard = []
    
    for team in teams:
        member_ids = [team.leader_id]
        if team.member_id:
            member_ids.append(team.member_id)
        
        # Only count completed manual submissions with a similarity score
        team_submissions = (
            Submission.objects
            .filter(
                user_id__in=member_ids,
                is_auto_save=False,
                status='completed',
                similarity_score__isnull=False,
            )
            .select_related('challenge')
        )
        
        if not team_submissions.exists():
            continue
        
        # Score per unique challenge (if somehow duplicates exist, take best)
        challenge_scores = {}
        last_time = None
        
        for sub in team_submissions:
            cid = sub.challenge_id
            score = float(sub.similarity_score) * sub.challenge.points
            
            # Keep best score per challenge
            if cid not in challenge_scores or score > challenge_scores[cid]:
                challenge_scores[cid] = score
            
            if last_time is None or sub.submitted_at > last_time:
                last_time = sub.submitted_at

        total_score = round(sum(challenge_scores.values()), 2)
        challenges_solved = len(challenge_scores)
        
        # Total code length for tiebreaker
        total_code_length = sum(sub.code_length for sub in team_submissions)
        
        # Average similarity
        sims = [float(sub.similarity_score) for sub in team_submissions if sub.similarity_score]
        avg_similarity = round(sum(sims) / max(len(sims), 1), 4)
        
        entry = {
            'team_name': team.name,
            'leader_name': team.leader.name,
            'leader_htp_id': team.leader.htp_id,
            'member_name': team.member.name if team.member else None,
            'member_htp_id': team.member.htp_id if team.member else None,
            'total_score': total_score,
            'challenges_solved': challenges_solved,
            'avg_similarity': avg_similarity,
            'total_code_length': total_code_length,
            'last_submission_time': last_time,
        }
        leaderboard.append(entry)
    
    # Sort: highest score → earliest last submission → shortest code → alpha name
    leaderboard.sort(
        key=lambda x: (
            -x['total_score'],
            x['last_submission_time'],
            x['total_code_length'],
            x['team_name'].lower(),
        )
    )
    
    # Assign ranks
    for i, entry in enumerate(leaderboard, start=1):
        entry['rank'] = i
        entry['last_submission_time'] = (
            entry['last_submission_time'].isoformat()
            if entry['last_submission_time'] else None
        )
    
    return leaderboard
