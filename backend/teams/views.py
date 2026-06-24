from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Team
from .serializers import TeamSerializer, CreateTeamSerializer, JoinTeamSerializer


def get_user_team(user):
    """Get the team a user belongs to (as leader or member)."""
    team = Team.objects.filter(leader=user).first()
    if team:
        return team
    team = Team.objects.filter(member=user).first()
    return team


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_team(request):
    """Get current user's team."""
    team = get_user_team(request.user)
    if not team:
        return Response({'team': None})
    return Response({'team': TeamSerializer(team).data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_team(request):
    """Create a new team. User becomes the leader."""
    existing = get_user_team(request.user)
    if existing:
        return Response({
            'error': 'You are already in a team'
        }, status=status.HTTP_400_BAD_REQUEST)

    serializer = CreateTeamSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    team = Team.objects.create(
        name=serializer.validated_data['name'],
        leader=request.user
    )

    return Response({
        'message': 'Team created successfully',
        'team': TeamSerializer(team).data
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_team(request):
    """Join a team using invite code."""
    existing = get_user_team(request.user)
    if existing:
        return Response({
            'error': 'You are already in a team'
        }, status=status.HTTP_400_BAD_REQUEST)

    serializer = JoinTeamSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    code = serializer.validated_data['invite_code']

    try:
        team = Team.objects.get(invite_code=code)
    except Team.DoesNotExist:
        return Response({
            'error': 'Invalid invite code'
        }, status=status.HTTP_404_NOT_FOUND)

    if team.is_full:
        return Response({
            'error': 'This team is already full'
        }, status=status.HTTP_400_BAD_REQUEST)

    if team.leader == request.user:
        return Response({
            'error': 'You cannot join your own team'
        }, status=status.HTTP_400_BAD_REQUEST)

    team.add_member(request.user)

    return Response({
        'message': f'Joined team "{team.name}" successfully',
        'team': TeamSerializer(team).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_team(request):
    """Leave current team. Leader cannot leave (must delete)."""
    team = get_user_team(request.user)
    if not team:
        return Response({
            'error': 'You are not in a team'
        }, status=status.HTTP_400_BAD_REQUEST)

    if team.leader == request.user:
        # Leader deletes the team
        team.delete()
        return Response({'message': 'Team deleted'})
    else:
        # Member leaves
        team.remove_member()
        return Response({'message': 'You have left the team'})
