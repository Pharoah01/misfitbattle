from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
from .serializers import UserRegistrationSerializer, UserSerializer, LoginSerializer
from utils.throttling import AuthRateThrottle, LoginRateThrottle
from .session_service import SessionSecurityService
from .session_models import UserSession

User = get_user_model()


class SignUpView(generics.CreateAPIView):
    """
    User registration endpoint.
    Creates a new user with register_number, name, email, and password.
    Returns authentication token upon successful registration.
    
    Rate limit: 10 requests per hour per IP
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        token, created = Token.objects.get_or_create(user=user)
        
        session = SessionSecurityService.create_session(user, request)
        
        return Response({
            'token': token.key,
            'session_id': str(session.session_id),
            'user': {
                'id': user.id,
                'register_number': user.register_number,
                'name': user.name,
                'email': user.email,
                'college_name': user.college_name,
                'profile_completed': user.profile_completed,
                'is_admin': user.is_admin,
                'created_at': user.created_at
            }
        }, status=status.HTTP_201_CREATED)


class SignInView(generics.GenericAPIView):
    """
    User login endpoint.
    Authenticates user with register_number and password.
    Returns authentication token upon successful login.
    
    Rate limit: 4 attempts per minute per IP
    """
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]
    
    def post(self, request):
        register_number = request.data.get('register_number')
        password = request.data.get('password')
        
        if not register_number or not password:
            SessionSecurityService.log_login_attempt(
                register_number=register_number or '',
                ip_address=SessionSecurityService.get_client_ip(request),
                user_agent=SessionSecurityService.get_user_agent(request),
                success=False
            )
            return Response({
                'error': 'Please provide both register_number and password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(request, username=register_number, password=password)
        
        if user is None:
            SessionSecurityService.log_login_attempt(
                register_number=register_number,
                ip_address=SessionSecurityService.get_client_ip(request),
                user_agent=SessionSecurityService.get_user_agent(request),
                success=False
            )
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        token, created = Token.objects.get_or_create(user=user)
        
        session = SessionSecurityService.create_session(user, request)
        
        return Response({
            'token': token.key,
            'session_id': str(session.session_id),
            'user': {
                'id': user.id,
                'register_number': user.register_number,
                'name': user.name,
                'email': user.email,
                'college_name': user.college_name,
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
    """
    User logout endpoint.
    Deletes the user's authentication token.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            SessionSecurityService.invalidate_session(request.user)
            
            request.user.auth_token.delete()
            return Response({'message': 'Successfully signed out'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'message': 'Successfully signed out'}, status=status.HTTP_200_OK)


class CurrentUserView(generics.RetrieveAPIView):
    """
    Get current authenticated user details.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class CompleteProfileView(generics.GenericAPIView):
    """
    Profile completion endpoint.
    Updates user profile with name, register_number, and college_name.
    Sets profile_completed to True upon successful update.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        name = request.data.get('name', '').strip()
        register_number = request.data.get('register_number', '').strip()
        college_name = request.data.get('college_name', '').strip()
        
        if not name or not register_number or not college_name:
            return Response({
                'error': 'All fields are required: name, register_number, college_name'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.name = name
        user.register_number = register_number
        user.college_name = college_name
        user.profile_completed = True
        user.save()
        
        return Response({
            'message': 'Profile completed successfully',
            'user': {
                'id': user.id,
                'register_number': user.register_number,
                'name': user.name,
                'college_name': user.college_name,
                'email': user.email,
                'profile_completed': user.profile_completed,
                'is_admin': user.is_admin
            }
        }, status=status.HTTP_200_OK)


class UpdateProfileView(generics.GenericAPIView):
    """
    Profile update endpoint.
    Allows users to update their profile information.
    """
    permission_classes = [IsAuthenticated]
    
    def put(self, request):
        user = request.user
        
        name = request.data.get('name', '').strip()
        college_name = request.data.get('college_name', '').strip()
        email = request.data.get('email', '').strip()
        
        if not name:
            return Response({
                'error': 'Name is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not college_name:
            return Response({
                'error': 'College name is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        import re
        email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_pattern, email):
            return Response({
                'error': 'Invalid email format'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exclude(id=user.id).exists():
            return Response({
                'error': 'This email is already in use'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.name = name
        user.college_name = college_name
        user.email = email
        
        if name and college_name and email and user.register_number:
            user.profile_completed = True
        
        user.save()
        
        return Response({
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'register_number': user.register_number,
                'name': user.name,
                'college_name': user.college_name,
                'email': user.email,
                'profile_completed': user.profile_completed,
                'is_admin': user.is_admin
            }
        }, status=status.HTTP_200_OK)


RegisterView = SignUpView
LoginView = SignInView
LogoutView = SignOutView

