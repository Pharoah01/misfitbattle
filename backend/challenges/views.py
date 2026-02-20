from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Challenge
from .serializers import ChallengeSerializer
from .permissions import IsAdminOrReadOnly


class ChallengeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Challenge CRUD operations.
    
    List: GET /api/challenges/
    Retrieve: GET /api/challenges/{id}/
    Create: POST /api/challenges/ (admin only)
    Update: PUT/PATCH /api/challenges/{id}/ (admin only)
    Delete: DELETE /api/challenges/{id}/ (admin only)
    
    Filtering:
    - ?points=100
    - ?points__gte=100 (greater than or equal)
    - ?points__lte=200 (less than or equal)
    
    Searching:
    - ?search=button (searches in title and description)
    
    Ordering:
    - ?ordering=points (ascending)
    - ?ordering=-points (descending)
    - ?ordering=-created_at (newest first)
    """
    queryset = Challenge.objects.all()
    serializer_class = ChallengeSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'points': ['exact', 'gte', 'lte'],
        'created_at': ['gte', 'lte'],
    }
    search_fields = ['title', 'description']
    ordering_fields = ['points', 'created_at', 'title']
    ordering = ['created_at']

