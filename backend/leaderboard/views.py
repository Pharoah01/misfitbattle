from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.core.cache import cache
from .services import calculate_leaderboard


class LeaderboardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        frozen = getattr(settings, 'LEADERBOARD_FROZEN', False)
        
        if frozen:
            # Return cached/frozen leaderboard
            cached = cache.get('frozen_leaderboard')
            if cached:
                return Response({'leaderboard': cached, 'frozen': True})
            # First time freezing — calculate once and cache permanently
            leaderboard = calculate_leaderboard()
            cache.set('frozen_leaderboard', leaderboard, timeout=None)
            return Response({'leaderboard': leaderboard, 'frozen': True})
        
        leaderboard = calculate_leaderboard()
        return Response({'leaderboard': leaderboard, 'frozen': False})
