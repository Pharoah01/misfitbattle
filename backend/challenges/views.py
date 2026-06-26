from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Challenge
from .serializers import ChallengeSerializer
from .permissions import IsAdminOrReadOnly


class ChallengeViewSet(viewsets.ModelViewSet):
    serializer_class = ChallengeSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'points': ['exact', 'gte', 'lte'],
        'created_at': ['gte', 'lte'],
        'difficulty': ['exact'],
    }
    search_fields = ['title', 'description']
    ordering_fields = ['points', 'created_at', 'title']
    ordering = ['created_at']
    lookup_field = 'slug'
    
    def get_queryset(self):
        """
        All users (including admins) only see released challenges on the API.
        Admin panel (/jaswanth) has its own endpoint for full visibility.
        """
        return Challenge.objects.filter(
            is_released=True
        ).exclude(slug__isnull=True).exclude(slug='')
    
    def get_object(self):
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        filter_kwargs = {}
        
        lookup_value = self.kwargs[lookup_url_kwarg]
        
        if lookup_value.isdigit():
            filter_kwargs['id'] = int(lookup_value)
        else:
            filter_kwargs['slug'] = lookup_value
        
        queryset = self.filter_queryset(self.get_queryset())
        obj = queryset.filter(**filter_kwargs).first()
        
        if not obj:
            from rest_framework.exceptions import NotFound
            raise NotFound('Challenge not found')
        
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def release(self, request, slug=None):
        """Admin: release a challenge (make visible to participants)."""
        if not request.user.is_admin:
            return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
        
        challenge = self.get_object()
        challenge.is_released = True
        challenge.save(update_fields=['is_released'])
        return Response({'message': f'"{challenge.title}" released', 'id': challenge.id, 'is_released': True})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unrelease(self, request, slug=None):
        """Admin: hide a challenge from participants."""
        if not request.user.is_admin:
            return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
        
        challenge = self.get_object()
        challenge.is_released = False
        challenge.save(update_fields=['is_released'])
        return Response({'message': f'"{challenge.title}" hidden', 'id': challenge.id, 'is_released': False})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def lock(self, request, slug=None):
        """Admin: lock submissions for a challenge."""
        if not request.user.is_admin:
            return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
        
        challenge = self.get_object()
        challenge.is_locked = True
        challenge.save(update_fields=['is_locked'])
        return Response({'message': f'"{challenge.title}" locked', 'id': challenge.id, 'is_locked': True})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unlock(self, request, slug=None):
        """Admin: unlock submissions for a challenge."""
        if not request.user.is_admin:
            return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
        
        challenge = self.get_object()
        challenge.is_locked = False
        challenge.save(update_fields=['is_locked'])
        return Response({'message': f'"{challenge.title}" unlocked', 'id': challenge.id, 'is_locked': False})
