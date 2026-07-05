from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import IntegrityError
from django.conf import settings
from django.utils import timezone
from datetime import datetime
from .models import Submission
from .serializers import SubmissionSerializer, SubmissionCreateSerializer
from .permissions import IsOwnerOrAdmin
from .tasks import process_submission_task
from teams.models import Team
import asyncio
from .services.renderer import HTMLRenderer
from pathlib import Path


def get_competition_window():
    """Parse competition start/end from settings. Returns (start, end) or (None, None)."""
    start_str = getattr(settings, 'COMPETITION_START', '')
    end_str = getattr(settings, 'COMPETITION_END', '')
    start = None
    end = None
    if start_str:
        try:
            start = datetime.fromisoformat(start_str)
        except ValueError:
            pass
    if end_str:
        try:
            end = datetime.fromisoformat(end_str)
        except ValueError:
            pass
    return start, end


def is_competition_active():
    """Check if the competition is currently active. Returns (active, message)."""
    from .competition_state import CompetitionState
    start, end = get_competition_window()
    if not start and not end:
        return True, None  # No time lock configured
    
    now = timezone.now()
    if start and now < start:
        return False, f'Competition has not started yet. Starts at {start.strftime("%b %d, %I:%M %p")}'
    
    if end:
        # Adjust end time by paused + extended duration
        total_adjustment = CompetitionState.get_total_paused_seconds() + CompetitionState.get_total_extended_seconds()
        adjusted_end = end + timezone.timedelta(seconds=total_adjustment)
        if now > adjusted_end:
            return False, 'Competition has ended. No more submissions allowed.'
    
    return True, None


def get_user_team(user):
    """Get the team a user belongs to."""
    team = Team.objects.filter(leader=user).first()
    if team:
        return team
    return Team.objects.filter(member=user).first()


class SubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Submission CRUD operations.
    
    List: GET /api/submissions/ (user's own submissions)
    Retrieve: GET /api/submissions/{id}/
    Create: POST /api/submissions/
    Delete: DELETE /api/submissions/{id}/ (own submissions or admin)
    
    Filtering:
    - ?challenge=1
    - ?code_length__gte=100
    - ?code_length__lte=500
    - ?submitted_at__gte=2024-01-01
    
    Searching:
    - ?search=button (searches in html_code and css_code)
    
    Ordering:
    - ?ordering=code_length
    - ?ordering=-submitted_at (newest first)
    - ?ordering=challenge
    
    Admin endpoints:
    - GET /api/submissions/all/ (all submissions)
    - GET /api/submissions/challenge/{id}/ (by challenge)
    - GET /api/submissions/user/{id}/ (by user)
    """
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'challenge': ['exact'],
        'code_length': ['exact', 'gte', 'lte'],
        'submitted_at': ['gte', 'lte'],
    }
    search_fields = ['html_code', 'css_code', 'challenge__title']
    ordering_fields = ['code_length', 'submitted_at', 'challenge']
    ordering = ['-submitted_at']
    
    def get_queryset(self):
        return Submission.objects.select_related('user', 'challenge').filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SubmissionCreateSerializer
        return SubmissionSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create submission with team-based limit + competition lock.
        
        Rules:
        - Competition must be active (between start/end times)
        - Auto-save: Always allowed, doesn't count toward limit
        - Manual submission: Max 1 per TEAM per challenge
        - If teammate already submitted for this challenge, blocked
        - User must be in a team to submit manually
        """
        # Check competition timing
        active, msg = is_competition_active()
        if not active:
            return Response({
                'error': msg,
                'code': 'COMPETITION_LOCKED'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if competition is paused
        from .competition_state import CompetitionState
        if CompetitionState.is_paused():
            return Response({
                'error': 'Competition is currently paused. Please wait.',
                'code': 'COMPETITION_PAUSED'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        challenge_id = serializer.validated_data['challenge'].id
        is_auto_save = request.data.get('is_auto_save', False)
        
        # Auto-save logic (unchanged — always allowed)
        if is_auto_save:
            existing_auto = Submission.objects.filter(
                user=request.user,
                challenge_id=challenge_id,
                is_auto_save=True
            ).first()
            
            if existing_auto:
                existing_auto.html_code = serializer.validated_data['html_code']
                existing_auto.css_code = serializer.validated_data['css_code']
                existing_auto.status = 'pending'
                existing_auto.error_message = None
                existing_auto.save()
                submission = existing_auto
            else:
                submission = serializer.save(
                    user=request.user,
                    status='queued',
                    is_auto_save=True,
                    submission_count=0
                )
            
            if getattr(settings, 'USE_CELERY', True):
                process_submission_task.delay(submission.id)
            else:
                self._process_submission_sync(submission)
            
            return Response({
                'id': submission.id,
                'status': 'pending',
                'message': 'Code auto-saved',
                'submitted_at': submission.submitted_at,
                'challenge': submission.challenge.id,
                'code_length': submission.code_length,
                'is_auto_save': True
            }, status=status.HTTP_200_OK if existing_auto else status.HTTP_201_CREATED)
        
        # Manual submission — team-based limit
        team = get_user_team(request.user)
        if not team:
            return Response({
                'error': 'You must be in a team to submit.',
                'code': 'NO_TEAM'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if challenge is locked
        from challenges.models import Challenge
        challenge_obj = serializer.validated_data['challenge']
        if challenge_obj.is_locked:
            return Response({
                'error': 'This challenge is locked. No more submissions accepted.',
                'code': 'CHALLENGE_LOCKED'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if ANYONE on the team already submitted for this challenge
        team_member_ids = [team.leader_id]
        if team.member_id:
            team_member_ids.append(team.member_id)
        
        team_submission = Submission.objects.filter(
            user_id__in=team_member_ids,
            challenge_id=challenge_id,
            is_auto_save=False
        ).first()
        
        if team_submission:
            submitter_name = team_submission.user.name
            return Response({
                'error': f'Your team already submitted for this challenge (by {submitter_name}).',
                'code': 'TEAM_ALREADY_SUBMITTED',
                'submitted_by': submitter_name
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Create submission
        submission = serializer.save(
            user=request.user,
            status='queued',
            is_auto_save=False,
            submission_count=1
        )
        
        if getattr(settings, 'USE_CELERY', True):
            process_submission_task.delay(submission.id)
        else:
            self._process_submission_sync(submission)
        
        return Response({
            'id': submission.id,
            'status': 'pending',
            'message': 'Submission received. This is your team\'s only submission for this challenge.',
            'submitted_at': submission.submitted_at,
            'challenge': submission.challenge.id,
            'code_length': submission.code_length,
            'is_auto_save': False,
            'submission_count': 1,
            'remaining_submissions': 0
        }, status=status.HTTP_201_CREATED)
    
    def _process_submission_sync(self, submission):
        """
        Synchronous submission processing for development (when Celery is not available).
        Only renders the image, skips heatmap comparison.
        """
        try:
            submission.status = 'processing'
            submission.save(update_fields=['status'])
            
            renderer = HTMLRenderer()
            image_path = asyncio.run(
                renderer.render_submission(
                    html_code=submission.html_code,
                    css_code=submission.css_code,
                    challenge_name=submission.challenge.title,
                    user_email=submission.user.email
                )
            )
            
            submission.rendered_image = image_path
            submission.status = 'completed'
            submission.error_message = None
            submission.save(update_fields=['rendered_image', 'status', 'error_message'])
            
        except Exception as e:
            submission.status = 'failed'
            submission.error_message = str(e)
            submission.save(update_fields=['status', 'error_message'])
    
    def perform_destroy(self, instance):
        """Allow users to delete their own submissions, admins can delete any."""
        if not self.request.user.is_admin and instance.user != self.request.user:
            raise PermissionError("You can only delete your own submissions")
        instance.delete()
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def all(self, request):
        """Admin-only endpoint to view all submissions"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Admin privileges required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.filter_queryset(Submission.objects.select_related('user', 'challenge').all())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='challenge/(?P<challenge_id>[^/.]+)')
    def by_challenge(self, request, challenge_id=None):
        """Admin-only endpoint to view submissions for a specific challenge"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Admin privileges required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.filter_queryset(
            Submission.objects.select_related('user', 'challenge').filter(challenge_id=challenge_id)
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>[^/.]+)')
    def by_user(self, request, user_id=None):
        """Admin-only endpoint to view submissions for a specific user"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Admin privileges required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.filter_queryset(
            Submission.objects.select_related('user', 'challenge').filter(user_id=user_id)
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


from rest_framework.decorators import api_view, permission_classes as perm_classes
from rest_framework.permissions import AllowAny


@api_view(['GET'])
@perm_classes([AllowAny])
def competition_status(request):
    """
    Returns competition timing info and whether submissions are currently open.
    No auth required — used by frontend to show timer.
    """
    from .competition_state import CompetitionState

    start, end = get_competition_window()
    active, msg = is_competition_active()
    now = timezone.now()
    
    comp_state = CompetitionState.get()
    is_paused = comp_state.state == 'paused'
    total_paused = CompetitionState.get_total_paused_seconds()

    data = {
        'is_active': active and not is_paused,
        'is_paused': is_paused,
        'competition_state': comp_state.state,
        'message': 'Competition is currently paused. Please wait for further instructions.' if is_paused else msg,
        'server_time': now.isoformat(),
        'registration_open': getattr(settings, 'REGISTRATION_OPEN', True),
        'leaderboard_frozen': getattr(settings, 'LEADERBOARD_FROZEN', False),
        'total_paused_seconds': total_paused,
        'total_extended_seconds': CompetitionState.get_total_extended_seconds(),
    }

    if start:
        data['start_time'] = start.isoformat()
    if end:
        data['end_time'] = end.isoformat()

    # If user is authenticated, include their team submission counts
    if request.user and request.user.is_authenticated:
        team = get_user_team(request.user)
        if team and team.is_full:
            team_member_ids = [team.leader_id, team.member_id]
            challenges_submitted = Submission.objects.filter(
                user_id__in=team_member_ids,
                is_auto_save=False
            ).values_list('challenge_id', flat=True).distinct()
            data['team_submissions_count'] = len(challenges_submitted)
            data['team_name'] = team.name
        else:
            data['team_submissions_count'] = 0
            data['team_name'] = team.name if team else None

    return Response(data)


@api_view(['POST'])
@perm_classes([IsAuthenticated])
def pause_competition(request):
    """Admin: Pause the competition."""
    if not request.user.is_admin:
        return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
    
    from .competition_state import CompetitionState
    from auditlog.services import log_event
    state = CompetitionState.get()
    state.pause()
    log_event('competition.pause', user=request.user, request=request, description='Competition paused')
    return Response({'message': 'Competition paused', 'state': 'paused', 'paused_at': state.paused_at})


@api_view(['POST'])
@perm_classes([IsAuthenticated])
def resume_competition(request):
    """Admin: Resume the competition."""
    if not request.user.is_admin:
        return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
    
    from .competition_state import CompetitionState
    from auditlog.services import log_event
    state = CompetitionState.get()
    state.resume()
    log_event('competition.resume', user=request.user, request=request, description='Competition resumed')
    return Response({'message': 'Competition resumed', 'state': 'active', 'total_paused_seconds': state.total_paused_seconds})


@api_view(['POST'])
@perm_classes([IsAuthenticated])
def extend_competition(request):
    """Admin: Extend competition time by N minutes."""
    if not request.user.is_admin:
        return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
    
    minutes = request.data.get('minutes')
    if not minutes or int(minutes) <= 0:
        return Response({'error': 'Provide positive minutes value'}, status=status.HTTP_400_BAD_REQUEST)
    
    minutes = int(minutes)
    
    from .competition_state import CompetitionState
    state = CompetitionState.get()
    
    if state.state == 'ended':
        return Response({'error': 'Cannot extend an ended competition'}, status=status.HTTP_400_BAD_REQUEST)
    
    state.extend(minutes)
    
    from auditlog.services import log_event
    log_event('competition.extend', user=request.user, request=request,
              description=f'Competition extended by {minutes} minutes',
              after_value=f'+{minutes}min (total: {state.total_extended_seconds//60}min)')
    
    return Response({
        'message': f'Competition extended by {minutes} minutes',
        'total_extended_seconds': state.total_extended_seconds,
        'total_extended_minutes': state.total_extended_seconds // 60,
    })


@api_view(['POST'])
@perm_classes([IsAuthenticated])
def retry_submission(request, submission_id):
    """Admin: Retry a failed submission."""
    if not request.user.is_admin:
        return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        sub = Submission.objects.get(id=submission_id)
    except Submission.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    
    sub.status = 'queued'
    sub.error_message = None
    sub.save(update_fields=['status', 'error_message'])
    
    if getattr(settings, 'USE_CELERY', True):
        process_submission_task.delay(sub.id)
    
    return Response({'message': f'Submission {submission_id} requeued'})


@api_view(['GET'])
@perm_classes([IsAuthenticated])
def submission_comparison(request, submission_id):
    """Get submission images for pixel diff viewer (own team only)."""
    try:
        sub = Submission.objects.select_related('user', 'challenge').get(id=submission_id)
    except Submission.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Access control: own team or admin
    if not request.user.is_admin:
        team = get_user_team(request.user)
        if not team:
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        member_ids = [team.leader_id]
        if team.member_id:
            member_ids.append(team.member_id)
        if sub.user_id not in member_ids:
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    
    data = {
        'id': sub.id,
        'challenge_title': sub.challenge.title,
        'challenge_difficulty': sub.challenge.difficulty,
        'challenge_points': sub.challenge.points,
        'submitted_by': sub.user.name,
        'submitted_at': sub.submitted_at.isoformat(),
        'status': sub.status,
        'similarity_score': float(sub.similarity_score) if sub.similarity_score else None,
        'score': round(float(sub.similarity_score) * sub.challenge.points, 2) if sub.similarity_score else None,
        'code_length': sub.code_length,
        'rendered_image': sub.rendered_image.url if sub.rendered_image else None,
        'ground_truth_image': sub.challenge.ground_truth_image.url if sub.challenge.ground_truth_image else None,
        'diff_image': None,
    }
    
    # Check if diff image exists
    if sub.rendered_image:
        from pathlib import Path
        rendered_path = Path(settings.MEDIA_ROOT) / sub.rendered_image.name
        diff_path = rendered_path.parent / f"diff_{rendered_path.name}"
        if diff_path.exists():
            data['diff_image'] = f"{settings.MEDIA_URL}submission_renders/diff_{rendered_path.name}"
    
    return Response(data)
