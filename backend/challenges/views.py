from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Challenge
from .serializers import ChallengeSerializer
from .permissions import IsAdminOrReadOnly


class ChallengeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Challenge CRUD operations.
    
    List: GET /api/challenges/ (public read access)
    Retrieve: GET /api/challenges/{id_or_slug}/ (public read access)
    Create: POST /api/challenges/ (admin only)
    Update: PUT/PATCH /api/challenges/{id_or_slug}/ (admin only)
    Delete: DELETE /api/challenges/{id_or_slug}/ (admin only)
    
    Supports lookup by ID or slug.
    
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
    permission_classes = [IsAdminOrReadOnly]  # Removed IsAuthenticated - allow public read
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'points': ['exact', 'gte', 'lte'],
        'created_at': ['gte', 'lte'],
        'difficulty': ['exact'],
    }
    search_fields = ['title', 'description']
    ordering_fields = ['points', 'created_at', 'title']
    ordering = ['created_at']
    lookup_field = 'slug'  # Use slug for URL lookups
    
    def get_object(self):
        """
        Override to support both ID and slug lookups.
        """
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        filter_kwargs = {}
        
        # Get the lookup value from URL
        lookup_value = self.kwargs[lookup_url_kwarg]
        
        # Try to determine if it's an ID (numeric) or slug
        if lookup_value.isdigit():
            filter_kwargs['id'] = int(lookup_value)
        else:
            filter_kwargs['slug'] = lookup_value
        
        queryset = self.filter_queryset(self.get_queryset())
        obj = queryset.filter(**filter_kwargs).first()
        
        if not obj:
            from rest_framework.exceptions import NotFound
            raise NotFound('Challenge not found')
        
        # May raise a permission denied
        self.check_object_permissions(self.request, obj)
        
        return obj

