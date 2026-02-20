from django.urls import path
from .views import SignUpView, SignInView, SignOutView, CurrentUserView

urlpatterns = [
    # Primary endpoints
    path('signup/', SignUpView.as_view(), name='signup'),
    path('signin/', SignInView.as_view(), name='signin'),
    path('signout/', SignOutView.as_view(), name='signout'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    
    # Backward compatibility aliases
    path('register/', SignUpView.as_view(), name='register'),
    path('login/', SignInView.as_view(), name='login'),
    path('logout/', SignOutView.as_view(), name='logout'),
]
