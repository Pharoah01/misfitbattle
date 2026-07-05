from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.db.models import Max, Avg, Count
from .models import PracticeSubmission, OfficialSolution
from submissions.tasks import process_submission_task


@api_view(['GET'])
@permission_classes([AllowAny])
def practice_status(request):
    """Check if practice mode is enabled."""
    return Response({'enabled': getattr(settings, 'PRACTICE_MODE_ENABLED', False)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def practice_submit(request):
    """Submit a practice solution. Unlimited attempts."""
    if not getattr(settings, 'PRACTICE_MODE_ENABLED', False):
        return Response({'error': 'Practice mode is not enabled'}, status=status.HTTP_403_FORBIDDEN)

    challenge_id = request.data.get('challenge')
    html_code = request.data.get('html_code', '')
    css_code = request.data.get('css_code', '')

    if not challenge_id or not html_code:
        return Response({'error': 'challenge and html_code required'}, status=status.HTTP_400_BAD_REQUEST)

    from challenges.models import Challenge
    try:
        challenge = Challenge.objects.get(id=challenge_id, is_released=True)
    except Challenge.DoesNotExist:
        return Response({'error': 'Challenge not found'}, status=status.HTTP_404_NOT_FOUND)

    sub = PracticeSubmission.objects.create(
        user=request.user,
        challenge=challenge,
        html_code=html_code,
        css_code=css_code,
        status='queued',
    )

    # Reuse existing task (it checks model type)
    # For now, process inline since practice doesn't need to be fast
    # TODO: Create a separate practice task or flag the existing one
    return Response({
        'id': sub.id,
        'status': 'queued',
        'message': 'Practice submission received',
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def practice_history(request, challenge_id):
    """Get user's practice submissions for a challenge."""
    subs = PracticeSubmission.objects.filter(
        user=request.user, challenge_id=challenge_id
    ).order_by('-submitted_at')[:20]

    data = [{
        'id': s.id,
        'similarity_score': float(s.similarity_score) if s.similarity_score else None,
        'code_length': s.code_length,
        'status': s.status,
        'submitted_at': s.submitted_at.isoformat(),
    } for s in subs]

    # Best score
    best = PracticeSubmission.objects.filter(
        user=request.user, challenge_id=challenge_id, similarity_score__isnull=False
    ).order_by('-similarity_score').first()

    return Response({
        'submissions': data,
        'total_attempts': PracticeSubmission.objects.filter(user=request.user, challenge_id=challenge_id).count(),
        'best_score': float(best.similarity_score) if best else None,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def practice_leaderboard(request):
    """Practice leaderboard — separate from competition."""
    if not getattr(settings, 'PRACTICE_MODE_ENABLED', False):
        return Response({'error': 'Practice mode not enabled'}, status=status.HTTP_403_FORBIDDEN)

    from django.contrib.auth import get_user_model
    User = get_user_model()

    # Best score per user per challenge
    user_scores = (
        PracticeSubmission.objects
        .filter(similarity_score__isnull=False)
        .values('user_id', 'challenge_id')
        .annotate(best_score=Max('similarity_score'))
    )

    # Aggregate per user
    user_totals = {}
    for entry in user_scores:
        uid = entry['user_id']
        if uid not in user_totals:
            user_totals[uid] = {'total': 0, 'count': 0, 'sims': []}
        from challenges.models import Challenge
        c = Challenge.objects.get(id=entry['challenge_id'])
        score = float(entry['best_score']) * c.points
        user_totals[uid]['total'] += score
        user_totals[uid]['count'] += 1
        user_totals[uid]['sims'].append(float(entry['best_score']))

    # Build leaderboard
    users = User.objects.filter(id__in=user_totals.keys())
    user_map = {u.id: u for u in users}

    leaderboard = []
    for uid, stats in user_totals.items():
        u = user_map.get(uid)
        if not u:
            continue
        leaderboard.append({
            'name': u.name,
            'htp_id': u.htp_id,
            'total_score': round(stats['total'], 2),
            'challenges_completed': stats['count'],
            'avg_similarity': round(sum(stats['sims']) / len(stats['sims']), 4),
        })

    leaderboard.sort(key=lambda x: -x['total_score'])
    for i, entry in enumerate(leaderboard, 1):
        entry['rank'] = i

    return Response({'leaderboard': leaderboard})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def official_solution(request, challenge_id):
    """Get official solution for a challenge (if published)."""
    try:
        sol = OfficialSolution.objects.get(challenge_id=challenge_id, is_published=True)
        return Response({
            'html_code': sol.html_code,
            'css_code': sol.css_code,
            'published_at': sol.published_at.isoformat(),
        })
    except OfficialSolution.DoesNotExist:
        return Response({'error': 'No solution published'}, status=status.HTTP_404_NOT_FOUND)


# --- Admin ---

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_practice_mode(request):
    """Admin: Toggle practice mode (note: requires .env change for persistence)."""
    if not request.user.is_admin:
        return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
    # This toggles in-memory only. For persistence, change .env + restart.
    current = getattr(settings, 'PRACTICE_MODE_ENABLED', False)
    settings.PRACTICE_MODE_ENABLED = not current
    return Response({'practice_mode': not current})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def publish_solution(request, challenge_id):
    """Admin: Publish official solution."""
    if not request.user.is_admin:
        return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)

    html_code = request.data.get('html_code', '')
    css_code = request.data.get('css_code', '')

    if not html_code:
        return Response({'error': 'html_code required'}, status=status.HTTP_400_BAD_REQUEST)

    sol, _ = OfficialSolution.objects.update_or_create(
        challenge_id=challenge_id,
        defaults={'html_code': html_code, 'css_code': css_code, 'is_published': True}
    )
    return Response({'message': 'Solution published'})
