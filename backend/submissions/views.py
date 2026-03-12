from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import IntegrityError
from django.conf import settings
from .models import Submission
from .serializers import SubmissionSerializer, SubmissionCreateSerializer
from .permissions import IsOwnerOrAdmin
from .tasks import process_submission_task
import asyncio
from .services.renderer import HTMLRenderer
from pathlib import Path


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
        # SECURITY FIX: Personal profile should ALWAYS show only user's own submissions
        # Admin functionality is handled by separate endpoints (/all/, /challenge/{id}/, /user/{id}/)
        return Submission.objects.select_related('user', 'challenge').filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SubmissionCreateSerializer
        return SubmissionSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create or update submission with single submission limit.
        
        Rules:
        - Auto-save (is_auto_save=True): Always allowed, doesn't count toward limit
        - Manual submission: Max 1 submission allowed per user per challenge
        - Second+ submission: Returns 403 error
        
        Queues background task for rendering and similarity scoring.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        challenge_id = serializer.validated_data['challenge'].id
        is_auto_save = request.data.get('is_auto_save', False)
        
        # Check existing submissions for this user+challenge
        existing_submissions = Submission.objects.filter(
            user=request.user,
            challenge_id=challenge_id
        ).order_by('-submitted_at')
        
        # Count manual submissions only (exclude auto-saves)
        manual_submission_count = existing_submissions.filter(is_auto_save=False).count()
        
        # Auto-save: Always allowed, create new or update latest auto-save
        if is_auto_save:
            latest_auto_save = existing_submissions.filter(is_auto_save=True).first()
            
            if latest_auto_save:
                # Update existing auto-save
                latest_auto_save.html_code = serializer.validated_data['html_code']
                latest_auto_save.css_code = serializer.validated_data['css_code']
                latest_auto_save.status = 'pending'
                latest_auto_save.error_message = None
                latest_auto_save.save()
                submission = latest_auto_save
            else:
                # Create new auto-save
                submission = serializer.save(
                    user=request.user,
                    status='pending',
                    is_auto_save=True,
                    submission_count=0
                )
            
            # Queue background processing
            if getattr(settings, 'USE_CELERY', True):
                process_submission_task.delay(submission.id)
            else:
                self._process_submission_sync(submission)
            
            return Response({
                'id': submission.id,
                'status': 'pending' if getattr(settings, 'USE_CELERY', True) else submission.status,
                'message': 'Code auto-saved',
                'submitted_at': submission.submitted_at,
                'challenge': submission.challenge.id,
                'code_length': submission.code_length,
                'is_auto_save': True
            }, status=status.HTTP_200_OK if latest_auto_save else status.HTTP_201_CREATED)
        
        # Manual submission: Check limit (max 1)
        if manual_submission_count >= 1:
            return Response({
                'error': 'You have already submitted for this challenge. Only one submission is allowed.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # First and only manual submission: Create new
        submission = serializer.save(
            user=request.user,
            status='pending',
            is_auto_save=False,
            submission_count=1
        )
        message = 'Submission received and queued for processing. This is your only submission.'
        
        # Process submission (async with Celery in production, sync in development)
        if getattr(settings, 'USE_CELERY', True):
            # Production: Queue background task
            process_submission_task.delay(submission.id)
        else:
            # Development: Process synchronously
            self._process_submission_sync(submission)
        
        return Response({
            'id': submission.id,
            'status': 'pending' if getattr(settings, 'USE_CELERY', True) else submission.status,
            'message': message,
            'submitted_at': submission.submitted_at,
            'challenge': submission.challenge.id,
            'code_length': submission.code_length,
            'is_auto_save': False,
            'submission_count': submission.submission_count,
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
            
            # Render HTML/CSS to image
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

