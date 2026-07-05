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
