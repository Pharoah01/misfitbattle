from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import IntegrityError
from .models import Submission
from .serializers import SubmissionSerializer, SubmissionCreateSerializer
from .permissions import IsOwnerOrAdmin
from .tasks import process_submission_task


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
        if self.request.user.is_admin:
            return Submission.objects.select_related('user', 'challenge').all()
        return Submission.objects.select_related('user', 'challenge').filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SubmissionCreateSerializer
        return SubmissionSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create a new submission with duplicate check and async processing.
        
        Returns 409 if user has already submitted for this challenge.
        Queues background task for rendering and similarity scoring.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Save submission with status='pending'
            submission = serializer.save(user=request.user, status='pending')
            
            # Queue background processing task
            process_submission_task.delay(submission.id)
            
            # Return immediate response
            response_serializer = SubmissionSerializer(submission)
            return Response({
                'id': submission.id,
                'status': 'pending',
                'message': 'Submission received and queued for processing',
                'submitted_at': submission.submitted_at,
                'challenge': submission.challenge.id,
                'code_length': submission.code_length
            }, status=status.HTTP_201_CREATED)
        
        except IntegrityError:
            # Duplicate submission (unique constraint violation)
            return Response({
                'error': 'You have already submitted for this challenge'
            }, status=status.HTTP_409_CONFLICT)
    
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

