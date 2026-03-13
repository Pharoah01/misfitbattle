from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Challenge
from .serializers import ChallengeSerializer
from .permissions import IsAdminOrReadOnly


class ChallengeViewSet(viewsets.ModelViewSet):
    queryset = Challenge.objects.all()
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

