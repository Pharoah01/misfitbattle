from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
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
        if (participant.team_name and 
            participant.css_battle_status in VALID_CSS_BATTLE_STATUSES):
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
        try:
            # Check if team with this name already exists
            team = Team.objects.filter(name__iexact=team_name).first()
            
            if team is None:
                # First member — create the team
                team = Team.objects.create(
                    name=team_name,
                    leader=user
                )
                logger.info(f"Auto-created team '{team_name}' for {user.htp_id}")
                return {
                    'name': team.name,
                    'invite_code': team.invite_code,
                    'is_full': False,
                    'role': 'leader'
                }
            elif not team.is_full:
                # Second member — join the team
                team.add_member(user)
                logger.info(f"Auto-joined {user.htp_id} to team '{team_name}'")
                return {
                    'name': team.name,
                    'invite_code': team.invite_code,
                    'is_full': True,
                    'role': 'member'
                }
            else:
                # Team is already full (shouldn't happen with teams of 2)
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
