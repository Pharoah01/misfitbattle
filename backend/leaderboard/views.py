from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from .services import calculate_leaderboard


class LeaderboardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        frozen = getattr(settings, 'LEADERBOARD_FROZEN', False)
        
        if frozen:
            cached = cache.get('frozen_leaderboard')
            if cached:
                return Response({
                    'leaderboard': cached,
                    'frozen': True,
                    'status': 'frozen',
                    'updated_at': cache.get('leaderboard_updated_at', ''),
                })
            leaderboard = calculate_leaderboard()
            cache.set('frozen_leaderboard', leaderboard, timeout=None)
            cache.set('leaderboard_updated_at', timezone.now().isoformat())
            return Response({
                'leaderboard': leaderboard,
                'frozen': True,
                'status': 'frozen',
                'updated_at': timezone.now().isoformat(),
            })
        
        # Use short cache (5s) to avoid recalculation on every request
        cached = cache.get('live_leaderboard')
        if cached:
            return Response({
                'leaderboard': cached,
                'frozen': False,
                'status': 'live',
                'updated_at': cache.get('leaderboard_updated_at', ''),
            })
        
        leaderboard = calculate_leaderboard()
        cache.set('live_leaderboard', leaderboard, timeout=5)
        cache.set('leaderboard_updated_at', timezone.now().isoformat(), timeout=60)
        
        return Response({
            'leaderboard': leaderboard,
            'frozen': False,
            'status': 'live',
            'updated_at': timezone.now().isoformat(),
        })
