from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
from .serializers import UserRegistrationSerializer, UserSerializer, LoginSerializer
from .htp_service import (
    verify_htpid,
    HTPParticipantNotFound,
    HTPAuthenticationError,
    HTPServiceUnavailable,
    HTPServiceError,
)
from utils.throttling import AuthRateThrottle, LoginRateThrottle
from .session_service import SessionSecurityService
from .session_models import UserSession
from teams.models import Team
import logging
import os

User = get_user_model()
logger = logging.getLogger(__name__)

VALID_CSS_BATTLE_STATUSES = ['PRESENT', 'CONFIRMED', 'RSVP_CONFIRMED']

# Skip eligibility check for testing (set SKIP_CSS_BATTLE_CHECK=True in .env)
SKIP_ELIGIBILITY_CHECK = os.environ.get('SKIP_CSS_BATTLE_CHECK', 'False') == 'True'


class SignUpView(generics.CreateAPIView):
    """
    User registration endpoint.
    
    Flow:
    1. User provides HTPID + password
    2. Backend verifies HTPID against HTP API
    3. Fetches participant details (name, email, college, department)
    4. Creates local user with those details
    5. Returns auth token + user data
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if registration is open
        if not getattr(settings, 'REGISTRATION_OPEN', True):
            return Response({
                'error': 'Registration is closed.',
                'code': 'REGISTRATION_CLOSED'
            }, status=status.HTTP_403_FORBIDDEN)
        
        htp_id = serializer.validated_data['htp_id']
        password = serializer.validated_data['password']
        
        # Verify HTPID against HTP API
        try:
            participant = verify_htpid(htp_id)
        except HTPParticipantNotFound as e:
            return Response({
                'error': str(e),
                'code': 'HTP_NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        except HTPAuthenticationError:
            logger.critical("HTP API key misconfigured")
            return Response({
                'error': 'Service configuration error. Please contact admin.',
                'code': 'HTP_AUTH_ERROR'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except HTPServiceUnavailable as e:
            return Response({
                'error': str(e),
                'code': 'HTP_UNAVAILABLE'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except HTPServiceError as e:
            return Response({
                'error': 'Unable to verify HTPID. Please try again.',
                'code': 'HTP_ERROR'
            }, status=status.HTTP_502_BAD_GATEWAY)
        
        if not participant.is_active:
            return Response({
                'error': 'Your HTP account is inactive. Please complete your HTP profile first.',
                'code': 'HTP_INACTIVE'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check CSS Battle eligibility
        if not SKIP_ELIGIBILITY_CHECK and participant.css_battle_status not in VALID_CSS_BATTLE_STATUSES:
            return Response({
                'error': 'You are not eligible for CSS Battle. Please confirm your attendance on HTP.',
                'code': 'NOT_ELIGIBLE'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Create user with details from HTP
        user = User.objects.create_user(
            htp_id=participant.htp_id,
            name=participant.name,
            email=participant.email,
            password=password,
            college_name=participant.college,
            department=participant.department,
            profile_completed=True,
        )
        
        # Auto-form team if participant has a team from HTP
        team_data = None
        if participant.team_name:
            team_data = self._auto_form_team(user, participant.team_name)
        
        token, created = Token.objects.get_or_create(user=user)
        session = SessionSecurityService.create_session(user, request)
        
        response_data = {
            'token': token.key,
            'session_id': str(session.session_id),
            'user': {
                'id': user.id,
                'htp_id': user.htp_id,
                'name': user.name,
                'email': user.email,
                'college_name': user.college_name,
                'department': user.department,
                'profile_completed': user.profile_completed,
                'is_admin': user.is_admin,
                'created_at': user.created_at
            }
        }
        
        if team_data:
            response_data['team'] = team_data
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    def _auto_form_team(self, user, team_name):
        """Auto-create or join team based on HTP team name."""
        from django.db import IntegrityError
        try:
            # Check if team exists (case-insensitive)
            team = Team.objects.filter(name__iexact=team_name).first()
            
            if team is None:
                # First member — create the team
                try:
                    team = Team.objects.create(name=team_name, leader=user)
                except IntegrityError:
                    # Race condition — another request created it
                    team = Team.objects.filter(name__iexact=team_name).first()
                    if team and not team.is_full:
                        team.add_member(user)
                        return {'name': team.name, 'invite_code': team.invite_code, 'is_full': True, 'role': 'member'}
                    return None
                
                logger.info(f"Auto-created team '{team_name}' for {user.htp_id}")
                return {'name': team.name, 'invite_code': team.invite_code, 'is_full': False, 'role': 'leader'}
            
            elif not team.is_full:
                team.add_member(user)
                logger.info(f"Auto-joined {user.htp_id} to team '{team_name}'")
                return {'name': team.name, 'invite_code': team.invite_code, 'is_full': True, 'role': 'member'}
            
            else:
                logger.warning(f"Team '{team_name}' already full when {user.htp_id} tried to join")
                return None
                
        except Exception as e:
            logger.error(f"Error auto-forming team for {user.htp_id}: {e}")
            return None


class SignInView(generics.GenericAPIView):
    """
    User login endpoint.
    Authenticates user with HTPID and password.
    """
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]
    
    def post(self, request):
        htp_id = request.data.get('htp_id', '').strip().upper()
        password = request.data.get('password')
        
        if not htp_id or not password:
            SessionSecurityService.log_login_attempt(
                register_number=htp_id or '',
                ip_address=SessionSecurityService.get_client_ip(request),
                user_agent=SessionSecurityService.get_user_agent(request),
                success=False
            )
            return Response({
                'error': 'Please provide both HTPID and password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate using htp_id field (USERNAME_FIELD)
        user = authenticate(request, username=htp_id, password=password)
        
        if user is None:
            SessionSecurityService.log_login_attempt(
                register_number=htp_id,
                ip_address=SessionSecurityService.get_client_ip(request),
                user_agent=SessionSecurityService.get_user_agent(request),
                success=False
            )
            return Response({
                'error': 'Invalid HTPID or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        token, created = Token.objects.get_or_create(user=user)
        session = SessionSecurityService.create_session(user, request)
        
        from auditlog.services import log_event
        log_event('auth.login', user=user, request=request, description=f'{user.name} signed in')
        
        return Response({
            'token': token.key,
            'session_id': str(session.session_id),
            'user': {
                'id': user.id,
                'htp_id': user.htp_id,
                'name': user.name,
                'email': user.email,
                'college_name': user.college_name,
                'department': user.department,
                'profile_completed': user.profile_completed,
                'is_admin': user.is_admin
            },
            'session_info': {
                'ip_address': session.ip_address,
                'country': session.country,
                'city': session.city,
                'created_at': session.created_at
            }
        })


class SignOutView(generics.GenericAPIView):
    """User logout endpoint."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            SessionSecurityService.invalidate_session(request.user)
            request.user.auth_token.delete()
            return Response({'message': 'Successfully signed out'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'message': 'Successfully signed out'}, status=status.HTTP_200_OK)


class CurrentUserView(generics.RetrieveAPIView):
    """Get current authenticated user details."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class CompleteProfileView(generics.GenericAPIView):
    """Profile completion endpoint."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        name = request.data.get('name', '').strip()
        college_name = request.data.get('college_name', '').strip()
        
        if not name:
            return Response({
                'error': 'Name is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.name = name
        if college_name:
            user.college_name = college_name
        user.profile_completed = True
        user.save()
        
        return Response({
            'message': 'Profile completed successfully',
            'user': {
                'id': user.id,
                'htp_id': user.htp_id,
                'name': user.name,
                'college_name': user.college_name,
                'department': user.department,
                'email': user.email,
                'profile_completed': user.profile_completed,
                'is_admin': user.is_admin
            }
        }, status=status.HTTP_200_OK)


class UpdateProfileView(generics.GenericAPIView):
    """Profile update endpoint."""
    permission_classes = [IsAuthenticated]
    
    def put(self, request):
        user = request.user
        
        name = request.data.get('name', '').strip()
        
        if not name:
            return Response({
                'error': 'Name is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.name = name
        user.save()
        
        return Response({
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'htp_id': user.htp_id,
                'name': user.name,
                'college_name': user.college_name,
                'department': user.department,
                'email': user.email,
                'profile_completed': user.profile_completed,
                'is_admin': user.is_admin
            }
        }, status=status.HTTP_200_OK)


# Aliases for backwards compatibility with URL patterns
RegisterView = SignUpView
LoginView = SignInView
LogoutView = SignOutView


from rest_framework.decorators import api_view, permission_classes as perm_dec


@api_view(['POST'])
@perm_dec([IsAuthenticated])
def heartbeat(request):
    """Update user's current page/activity. Called by frontend every 30s."""
    from .session_models import UserSession
    current_page = request.data.get('page', '')
    
    try:
        session = UserSession.objects.get(user=request.user, is_active=True)
        session.current_page = current_page[:100]
        session.save(update_fields=['current_page', 'last_activity'])
    except UserSession.DoesNotExist:
        pass
    
    return Response({'ok': True})


@api_view(['GET'])
@perm_dec([IsAuthenticated])
def personal_stats(request):
    """Get personal competition statistics."""
    from submissions.models import Submission
    from challenges.models import Challenge
    from teams.models import Team
    from leaderboard.services import calculate_leaderboard

    user = request.user
    team = Team.objects.filter(leader=user).first() or Team.objects.filter(member=user).first()

    # Get team member IDs
    member_ids = [user.id]
    if team:
        member_ids = [team.leader_id]
        if team.member_id:
            member_ids.append(team.member_id)

    # All manual submissions by team
    subs = Submission.objects.filter(
        user_id__in=member_ids, is_auto_save=False
    ).select_related('challenge')

    # Released challenges
    total_challenges = Challenge.objects.filter(is_released=True).count()

    # Per-challenge data
    challenge_data = []
    scores = []
    sims = []
    for sub in subs:
        sim = float(sub.similarity_score) if sub.similarity_score else None
        score = round(sim * sub.challenge.points, 2) if sim else None
        if sim:
            sims.append(sim)
        if score:
            scores.append({'title': sub.challenge.title, 'score': score, 'similarity': sim})
        challenge_data.append({
            'title': sub.challenge.title,
            'difficulty': sub.challenge.difficulty,
            'points': sub.challenge.points,
            'similarity': sim,
            'score': score,
            'status': sub.status,
            'submitted_at': sub.submitted_at.isoformat(),
        })

    # Rank
    leaderboard = calculate_leaderboard()
    rank = None
    if team:
        for entry in leaderboard:
            if entry['team_name'].lower() == team.name.lower():
                rank = entry['rank']
                break

    total_score = round(sum(s['score'] for s in scores), 2)
    completed = len([s for s in subs if s.status == 'completed'])
    best = max(scores, key=lambda x: x['score']) if scores else None
    lowest_sim = min(sims) if sims else None
    last_sub = max((s.submitted_at for s in subs), default=None)

    return Response({
        'rank': rank,
        'team_name': team.name if team else None,
        'total_score': total_score,
        'avg_similarity': round(sum(sims) / max(len(sims), 1), 4),
        'highest_similarity': round(max(sims), 4) if sims else None,
        'lowest_similarity': round(lowest_sim, 4) if lowest_sim else None,
        'challenges_completed': completed,
        'challenges_pending': total_challenges - completed,
        'total_challenges': total_challenges,
        'total_submissions': subs.count(),
        'last_submission': last_sub.isoformat() if last_sub else None,
        'best_challenge': best,
        'challenges': challenge_data,
    })


@api_view(['POST'])
@perm_dec([AllowAny])
def reset_password(request):
    """
    Password reset via HTPID verification.
    User provides HTPID + new password. Backend verifies HTPID against HTP API.
    """
    from .htp_service import verify_htpid, HTPParticipantNotFound, HTPServiceError
    from utils.throttling import AuthRateThrottle

    htp_id = request.data.get('htp_id', '').strip().upper()
    new_password = request.data.get('new_password', '')

    if not htp_id or not new_password:
        return Response({'error': 'HTPID and new password required'}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 8:
        return Response({'error': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)

    # Verify ownership via HTP API
    try:
        participant = verify_htpid(htp_id)
    except HTPParticipantNotFound:
        return Response({'error': 'HTPID not found'}, status=status.HTTP_404_NOT_FOUND)
    except HTPServiceError:
        return Response({'error': 'Unable to verify. Try again later.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    # Find user
    try:
        user = User.objects.get(htp_id=htp_id)
    except User.DoesNotExist:
        return Response({'error': 'No account with this HTPID. Please register first.'}, status=status.HTTP_404_NOT_FOUND)

    user.set_password(new_password)
    user.save()

    from auditlog.services import log_event
    log_event('auth.login', user=user, request=request, description=f'{user.name} reset password')

    return Response({'message': 'Password reset successful. You can now sign in.'})
