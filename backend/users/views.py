from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from .serializers import UserRegistrationSerializer, UserSerializer
from utils.throttling import AuthRateThrottle


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
        
        # Create token for the new user
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'register_number': user.register_number,
                'name': user.name,
                'email': user.email,
                'is_admin': user.is_admin,
                'created_at': user.created_at
            }
        }, status=status.HTTP_201_CREATED)


class SignInView(generics.GenericAPIView):
    """
    User login endpoint.
    Authenticates user with register_number and password.
    Returns authentication token upon successful login.
    
    Rate limit: 10 requests per hour per IP
    """
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]
    
    def post(self, request):
        register_number = request.data.get('register_number')
        password = request.data.get('password')
        
        if not register_number or not password:
            return Response({
                'error': 'Please provide both register_number and password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(request, username=register_number, password=password)
        
        if user is None:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get or create token
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'register_number': user.register_number,
                'name': user.name,
                'email': user.email,
                'is_admin': user.is_admin
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
            # Delete the user's token
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


# Backward compatibility aliases
RegisterView = SignUpView
LoginView = SignInView
LogoutView = SignOutView

