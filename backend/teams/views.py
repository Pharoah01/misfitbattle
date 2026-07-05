from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Team, ChallengeClaim, TeamActivity
from .serializers import TeamSerializer, CreateTeamSerializer, JoinTeamSerializer


def get_user_team(user):
    """Get the team a user belongs to (as leader or member)."""
    team = Team.objects.filter(leader=user).first()
    if team:
        return team
    team = Team.objects.filter(member=user).first()
    return team


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_team(request):
    """Get current user's team."""
    team = get_user_team(request.user)
    if not team:
        return Response({'team': None})
    return Response({'team': TeamSerializer(team).data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_team(request):
    """Create a new team. User becomes the leader."""
    existing = get_user_team(request.user)
    if existing:
        return Response({
            'error': 'You are already in a team'
        }, status=status.HTTP_400_BAD_REQUEST)

    serializer = CreateTeamSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    team = Team.objects.create(
        name=serializer.validated_data['name'],
        leader=request.user
    )

    return Response({
        'message': 'Team created successfully',
        'team': TeamSerializer(team).data
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_team(request):
    """Join a team using invite code."""
    existing = get_user_team(request.user)
    if existing:
        return Response({
            'error': 'You are already in a team'
        }, status=status.HTTP_400_BAD_REQUEST)

    serializer = JoinTeamSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    code = serializer.validated_data['invite_code']

    try:
        team = Team.objects.get(invite_code=code)
    except Team.DoesNotExist:
        return Response({
            'error': 'Invalid invite code'
        }, status=status.HTTP_404_NOT_FOUND)

    if team.is_full:
        return Response({
            'error': 'This team is already full'
        }, status=status.HTTP_400_BAD_REQUEST)

    if team.leader == request.user:
        return Response({
            'error': 'You cannot join your own team'
        }, status=status.HTTP_400_BAD_REQUEST)

    team.add_member(request.user)

    return Response({
        'message': f'Joined team "{team.name}" successfully',
        'team': TeamSerializer(team).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_team(request):
    """Leave current team. Leader cannot leave (must delete)."""
    team = get_user_team(request.user)
    if not team:
        return Response({
            'error': 'You are not in a team'
        }, status=status.HTTP_400_BAD_REQUEST)

    if team.leader == request.user:
        # Leader deletes the team
        team.delete()
        return Response({'message': 'Team deleted'})
    else:
        # Member leaves
        team.remove_member()
        return Response({'message': 'You have left the team'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def go_solo(request):
    """Mark team as solo — renames team to user's name and marks as full (solo entry)."""
    team = get_user_team(request.user)
    if not team:
        return Response({
            'error': 'You are not in a team'
        }, status=status.HTTP_400_BAD_REQUEST)

    if team.is_full:
        return Response({
            'error': 'Your team already has 2 members'
        }, status=status.HTTP_400_BAD_REQUEST)

    if team.leader != request.user:
        return Response({
            'error': 'Only the team leader can proceed solo'
        }, status=status.HTTP_403_FORBIDDEN)

    # Rename team to user's name and mark as full (solo)
    team.name = request.user.name
    team.is_full = True
    team.save(update_fields=['name', 'is_full'])

    return Response({
        'message': 'You are now a solo participant',
        'team': TeamSerializer(team).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_dashboard(request):
    """Full team dashboard — members, challenges, submissions, activity, rank."""
    team = get_user_team(request.user)
    if not team:
        return Response({'error': 'Not in a team'}, status=status.HTTP_400_BAD_REQUEST)

    from submissions.models import Submission
    from challenges.models import Challenge
    from users.session_models import UserSession
    from django.utils import timezone

    member_ids = [team.leader_id]
    if team.member_id:
        member_ids.append(team.member_id)

    # --- Members with online status ---
    members_data = []
    for uid in member_ids:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        u = User.objects.get(id=uid)
        session = UserSession.objects.filter(user=u, is_active=True).first()
        members_data.append({
            'name': u.name,
            'htp_id': u.htp_id,
            'is_leader': uid == team.leader_id,
            'is_online': session is not None and not session.is_session_expired(),
            'last_active': session.last_activity.isoformat() if session else None,
        })

    # --- All released challenges with submission status ---
    released_challenges = Challenge.objects.filter(is_released=True).order_by('difficulty', 'created_at')
    team_submissions = (
        Submission.objects
        .filter(user_id__in=member_ids, is_auto_save=False)
        .select_related('user', 'challenge')
    )
    sub_map = {s.challenge_id: s for s in team_submissions}

    challenges_data = []
    total_score = 0.0
    completed_count = 0
    scores_list = []

    for c in released_challenges:
        sub = sub_map.get(c.id)
        if sub:
            sim = float(sub.similarity_score) if sub.similarity_score else None
            score = round(sim * c.points, 2) if sim else None
            if score:
                total_score += score
                scores_list.append({'title': c.title, 'score': score})
            completed_count += 1 if sub.status == 'completed' else 0
            challenges_data.append({
                'id': c.id,
                'title': c.title,
                'difficulty': c.difficulty,
                'points': c.points,
                'is_locked': c.is_locked,
                'status': sub.status,
                'submission_id': sub.id,
                'submitted_by': sub.user.name,
                'submitted_by_htp_id': sub.user.htp_id,
                'submitted_at': sub.submitted_at.isoformat(),
                'similarity_score': sim,
                'score': score,
                'code_length': sub.code_length,
            })
        else:
            challenges_data.append({
                'id': c.id,
                'title': c.title,
                'difficulty': c.difficulty,
                'points': c.points,
                'is_locked': c.is_locked,
                'status': 'locked' if c.is_locked else 'not_started',
                'submitted_by': None,
                'submitted_by_htp_id': None,
                'submitted_at': None,
                'similarity_score': None,
                'score': None,
                'code_length': None,
            })

    total_challenges = released_challenges.count()
    total_score = round(total_score, 2)

    # --- Rank calculation ---
    from leaderboard.services import calculate_leaderboard
    leaderboard = calculate_leaderboard()
    rank = None
    for entry in leaderboard:
        if entry['team_name'].lower() == team.name.lower():
            rank = entry['rank']
            break

    # --- Member contributions ---
    contributions = []
    for m in members_data:
        m_subs = [s for s in team_submissions if s.user.htp_id == m['htp_id']]
        m_scores = [float(s.similarity_score) * s.challenge.points for s in m_subs if s.similarity_score]
        contributions.append({
            'name': m['name'],
            'htp_id': m['htp_id'],
            'challenges_submitted': len(m_subs),
            'total_points': round(sum(m_scores), 2),
            'avg_similarity': round(sum(float(s.similarity_score) for s in m_subs if s.similarity_score) / max(len([s for s in m_subs if s.similarity_score]), 1), 4),
        })

    # --- Highest scoring challenge ---
    highest = max(scores_list, key=lambda x: x['score']) if scores_list else None

    # --- Average similarity ---
    sims = [float(s.similarity_score) for s in team_submissions if s.similarity_score]
    avg_sim = round(sum(sims) / max(len(sims), 1), 4)

    # --- Activity Timeline ---
    activities = list(
        TeamActivity.objects.filter(team=team)
        .order_by('-created_at')[:20]
        .values('activity_type', 'description', 'created_at')
    )

    # --- Claims ---
    claims = {}
    for claim in ChallengeClaim.objects.filter(team=team).select_related('user', 'challenge'):
        claims[claim.challenge_id] = {
            'claimed_by': claim.user.name,
            'claimed_by_htp_id': claim.user.htp_id,
            'claimed_at': claim.claimed_at.isoformat(),
        }

    return Response({
        'team': TeamSerializer(team).data,
        'members': members_data,
        'challenges': challenges_data,
        'stats': {
            'total_score': total_score,
            'rank': rank,
            'completed': completed_count,
            'pending': total_challenges - completed_count,
            'locked': released_challenges.filter(is_locked=True).count(),
            'total_challenges': total_challenges,
            'avg_similarity': avg_sim,
            'highest_challenge': highest,
            'total_code_length': sum(s.code_length for s in team_submissions),
        },
        'contributions': contributions,
        'activities': activities,
        'claims': claims,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def claim_challenge(request):
    """Claim a challenge so teammate knows you're working on it."""
    team = get_user_team(request.user)
    if not team:
        return Response({'error': 'Not in a team'}, status=status.HTTP_400_BAD_REQUEST)

    challenge_id = request.data.get('challenge_id')
    if not challenge_id:
        return Response({'error': 'challenge_id required'}, status=status.HTTP_400_BAD_REQUEST)

    from challenges.models import Challenge
    try:
        challenge = Challenge.objects.get(id=challenge_id, is_released=True)
    except Challenge.DoesNotExist:
        return Response({'error': 'Challenge not found'}, status=status.HTTP_404_NOT_FOUND)

    # Check if already claimed by teammate
    existing = ChallengeClaim.objects.filter(team=team, challenge=challenge).first()
    if existing and existing.user != request.user:
        return Response({'error': f'Already claimed by {existing.user.name}'}, status=status.HTTP_400_BAD_REQUEST)

    claim, created = ChallengeClaim.objects.update_or_create(
        team=team, challenge=challenge,
        defaults={'user': request.user}
    )

    if created:
        TeamActivity.objects.create(
            team=team, user=request.user,
            activity_type='claim',
            description=f'{request.user.name} claimed {challenge.title}'
        )

    return Response({'message': f'Claimed {challenge.title}', 'claimed_by': request.user.name})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unclaim_challenge(request):
    """Release a claim on a challenge."""
    team = get_user_team(request.user)
    if not team:
        return Response({'error': 'Not in a team'}, status=status.HTTP_400_BAD_REQUEST)

    challenge_id = request.data.get('challenge_id')
    ChallengeClaim.objects.filter(team=team, challenge_id=challenge_id, user=request.user).delete()
    return Response({'message': 'Claim released'})
