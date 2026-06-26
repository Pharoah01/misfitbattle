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
    start, end = get_competition_window()
    if not start and not end:
        return True, None  # No time lock configured
    
    now = timezone.now()
    if start and now < start:
        return False, f'Competition has not started yet. Starts at {start.strftime("%b %d, %I:%M %p")}'
    if end and now > end:
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
                    status='pending',
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
            status='pending',
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
    start, end = get_competition_window()
    active, msg = is_competition_active()
    now = timezone.now()

    data = {
        'is_active': active,
        'message': msg,
        'server_time': now.isoformat(),
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
