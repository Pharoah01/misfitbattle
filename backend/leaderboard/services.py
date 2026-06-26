"""
Team-based leaderboard scoring.

Scoring logic:
- Each team gets points for each challenge they submitted
- Points = challenge's point value (10/20/30 based on difficulty)
- Tiebreaker: team with earliest last submission wins

Team Total Score = sum of points for all challenges submitted by either member.
"""

from django.db.models import Min, Max
from submissions.models import Submission
from teams.models import Team


def calculate_leaderboard():
    """
    Calculate team-based leaderboard rankings.
    
    Returns:
        list of dicts with: rank, team_name, leader_name, leader_htp_id,
        member_name, member_htp_id, total_points, challenges_solved,
        last_submission_time
    """
    teams = Team.objects.select_related('leader', 'member').all()
    
    leaderboard = []
    
    for team in teams:
        # Get all team member IDs
        member_ids = [team.leader_id]
        if team.member_id:
            member_ids.append(team.member_id)
        
        # Get all manual submissions by this team
        team_submissions = (
            Submission.objects
            .filter(user_id__in=member_ids, is_auto_save=False)
            .select_related('challenge')
        )
        
        if not team_submissions.exists():
            continue
        
        # Calculate points: sum of unique challenge points
        challenges_done = {}
        last_time = None
        
        for sub in team_submissions:
            cid = sub.challenge_id
            if cid not in challenges_done:
                challenges_done[cid] = sub.challenge.points
            
            if last_time is None or sub.submitted_at > last_time:
                last_time = sub.submitted_at

        total_points = sum(challenges_done.values())
        challenges_solved = len(challenges_done)
        
        entry = {
            'team_name': team.name,
            'leader_name': team.leader.name,
            'leader_htp_id': team.leader.htp_id,
            'member_name': team.member.name if team.member else None,
            'member_htp_id': team.member.htp_id if team.member else None,
            'total_points': total_points,
            'challenges_solved': challenges_solved,
            'last_submission_time': last_time,
        }
        leaderboard.append(entry)
    
    # Sort: highest points first, earliest last submission as tiebreaker
    leaderboard.sort(
        key=lambda x: (-x['total_points'], x['last_submission_time'])
    )
    
    # Assign ranks
    for i, entry in enumerate(leaderboard, start=1):
        entry['rank'] = i
        # Convert datetime for JSON serialization
        entry['last_submission_time'] = entry['last_submission_time'].isoformat() if entry['last_submission_time'] else None
    
    return leaderboard
