"""
CSV Export endpoints for admin panel.
"""

import csv
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from teams.models import Team
from submissions.models import Submission
from challenges.models import Challenge
from leaderboard.services import calculate_leaderboard
from auditlog.services import log_event

User = get_user_model()


def csv_response(filename, headers, rows):
    """Helper to create a CSV HttpResponse."""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    writer = csv.writer(response)
    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_leaderboard(request):
    if not request.user.is_admin:
        return Response({'error': 'Admin only'}, status=403)

    data = calculate_leaderboard()
    headers = ['Rank', 'Team Name', 'Leader', 'Leader HTPID', 'Member', 'Member HTPID',
               'Total Score', 'Challenges Solved', 'Avg Similarity', 'Total Code', 'Last Submission']
    rows = []
    for e in data:
        rows.append([
            e['rank'], e['team_name'], e['leader_name'], e['leader_htp_id'],
            e.get('member_name', ''), e.get('member_htp_id', ''),
            e['total_score'], e['challenges_solved'],
            e.get('avg_similarity', ''), e['total_code_length'],
            e.get('last_submission_time', ''),
        ])

    log_event('admin.action', user=request.user, request=request, description='Exported leaderboard')
    return csv_response('leaderboard.csv', headers, rows)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_teams(request):
    if not request.user.is_admin:
        return Response({'error': 'Admin only'}, status=403)

    teams = Team.objects.select_related('leader', 'member').all()
    headers = ['Team Name', 'Invite Code', 'Captain', 'Captain HTPID', 'Member', 'Member HTPID', 'Status', 'Created At']
    rows = []
    for t in teams:
        rows.append([
            t.name, t.invite_code, t.leader.name, t.leader.htp_id,
            t.member.name if t.member else '', t.member.htp_id if t.member else '',
            'Full' if t.is_full else 'Waiting', t.created_at.isoformat(),
        ])

    log_event('admin.action', user=request.user, request=request, description='Exported teams')
    return csv_response('teams.csv', headers, rows)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_participants(request):
    if not request.user.is_admin:
        return Response({'error': 'Admin only'}, status=403)

    users = User.objects.all().order_by('-created_at')
    headers = ['HTP ID', 'Name', 'Email', 'College', 'Department', 'Team', 'Registered At', 'Is Admin']
    rows = []
    for u in users:
        # Find team
        team = Team.objects.filter(leader=u).first() or Team.objects.filter(member=u).first()
        rows.append([
            u.htp_id, u.name, u.email or '', u.college_name, u.department,
            team.name if team else '', u.created_at.isoformat(), u.is_admin,
        ])

    log_event('admin.action', user=request.user, request=request, description='Exported participants')
    return csv_response('participants.csv', headers, rows)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_submissions(request):
    if not request.user.is_admin:
        return Response({'error': 'Admin only'}, status=403)

    subs = Submission.objects.select_related('user', 'challenge').filter(is_auto_save=False).order_by('-submitted_at')
    headers = ['ID', 'Team', 'Challenge', 'Submitted By', 'HTPID', 'Submitted At',
               'Similarity', 'Score', 'Code Length', 'Status']
    rows = []
    for s in subs:
        team = Team.objects.filter(leader=s.user).first() or Team.objects.filter(member=s.user).first()
        score = round(float(s.similarity_score) * s.challenge.points, 2) if s.similarity_score else ''
        rows.append([
            s.id, team.name if team else '', s.challenge.title, s.user.name, s.user.htp_id,
            s.submitted_at.isoformat(), float(s.similarity_score) if s.similarity_score else '',
            score, s.code_length, s.status,
        ])

    log_event('admin.action', user=request.user, request=request, description='Exported submissions')
    return csv_response('submissions.csv', headers, rows)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_challenge_scores(request):
    """Matrix: one row per team, columns = challenge scores."""
    if not request.user.is_admin:
        return Response({'error': 'Admin only'}, status=403)

    challenges = Challenge.objects.filter(is_released=True).order_by('difficulty', 'created_at')
    teams = Team.objects.select_related('leader', 'member').all()

    headers = ['Rank', 'Team Name'] + [c.title for c in challenges] + ['Total Score']

    # Get all submissions
    all_subs = Submission.objects.filter(is_auto_save=False, similarity_score__isnull=False).select_related('challenge')

    rows = []
    team_scores = []

    for team in teams:
        member_ids = [team.leader_id]
        if team.member_id:
            member_ids.append(team.member_id)

        team_subs = {s.challenge_id: s for s in all_subs if s.user_id in member_ids}
        row = [0, team.name]
        total = 0
        for c in challenges:
            sub = team_subs.get(c.id)
            if sub:
                score = round(float(sub.similarity_score) * c.points, 2)
                row.append(score)
                total += score
            else:
                row.append('')
        row.append(round(total, 2))
        row[0] = total  # temporary for sorting
        team_scores.append(row)

    # Sort by total descending
    team_scores.sort(key=lambda x: -x[0])
    for i, row in enumerate(team_scores, 1):
        row[0] = i  # Replace with rank

    log_event('admin.action', user=request.user, request=request, description='Exported challenge scores matrix')
    return csv_response('challenge_scores.csv', headers, team_scores)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def final_report(request):
    """Generate comprehensive competition final report as JSON."""
    if not request.user.is_admin:
        return Response({'error': 'Admin only'}, status=403)

    from django.utils import timezone
    from django.conf import settings
    from django.db.models import Count, Avg, Max, Min
    from submissions.competition_state import CompetitionState
    from announcements.models import Announcement
    from users.session_models import UserSession

    now = timezone.now()
    comp_state = CompetitionState.get()

    # 1. Competition Summary
    start = settings.COMPETITION_START
    end = settings.COMPETITION_END

    summary = {
        'name': 'Misfits Battle CSS Competition',
        'start_time': start or 'Not configured',
        'end_time': end or 'Not configured',
        'total_paused_seconds': comp_state.total_paused_seconds,
        'total_extended_seconds': comp_state.total_extended_seconds,
        'state': comp_state.state,
        'generated_at': now.isoformat(),
    }

    # 2. Participation
    total_users = User.objects.count()
    total_teams = Team.objects.count()
    teams_submitted = Team.objects.filter(
        leader__submissions__is_auto_save=False
    ).distinct().count()
    total_submissions = Submission.objects.filter(is_auto_save=False).count()
    completed_subs = Submission.objects.filter(is_auto_save=False, status='completed').count()
    failed_subs = Submission.objects.filter(is_auto_save=False, status='failed').count()
    active_sessions = UserSession.objects.filter(is_active=True).count()

    participation = {
        'total_registered': total_users,
        'total_teams': total_teams,
        'teams_submitted': teams_submitted,
        'active_sessions': active_sessions,
        'total_submissions': total_submissions,
        'completed_submissions': completed_subs,
        'failed_submissions': failed_subs,
    }

    # 3. Final Standings
    leaderboard = calculate_leaderboard()
    winner = leaderboard[0] if len(leaderboard) > 0 else None
    runner_up = leaderboard[1] if len(leaderboard) > 1 else None
    second_runner = leaderboard[2] if len(leaderboard) > 2 else None

    standings = {
        'winner': winner,
        'runner_up': runner_up,
        'second_runner_up': second_runner,
        'total_ranked_teams': len(leaderboard),
        'full_leaderboard': leaderboard,
    }

    # 4. Challenge Analytics
    challenges = Challenge.objects.filter(is_released=True).order_by('difficulty', 'created_at')
    challenge_analytics = []
    for c in challenges:
        subs = Submission.objects.filter(challenge=c, is_auto_save=False)
        completed = subs.filter(status='completed', similarity_score__isnull=False)
        stats = completed.aggregate(
            avg_sim=Avg('similarity_score'),
            max_sim=Max('similarity_score'),
            fastest=Min('submitted_at'),
        )
        challenge_analytics.append({
            'title': c.title,
            'difficulty': c.difficulty,
            'points': c.points,
            'total_attempts': subs.count(),
            'teams_completed': completed.count(),
            'highest_similarity': float(stats['max_sim']) if stats['max_sim'] else None,
            'average_similarity': float(stats['avg_sim']) if stats['avg_sim'] else None,
            'fastest_submission': stats['fastest'].isoformat() if stats['fastest'] else None,
        })

    # 5. Event Summary
    total_announcements = Announcement.objects.filter(is_active=True).count()

    event_summary = {
        'total_announcements': total_announcements,
        'total_pauses': comp_state.total_paused_seconds,
        'total_extensions_minutes': comp_state.total_extended_seconds // 60,
    }

    log_event('admin.action', user=request.user, request=request, description='Generated final competition report')

    return Response({
        'summary': summary,
        'participation': participation,
        'standings': standings,
        'challenge_analytics': challenge_analytics,
        'event_summary': event_summary,
    })
