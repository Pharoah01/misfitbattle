from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import calculate_leaderboard


class LeaderboardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        leaderboard = calculate_leaderboard()
        return Response(leaderboard)
