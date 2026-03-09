from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class SubmissionRateThrottle(UserRateThrottle):
    """
    Throttle for submission endpoints.
    Limits users to 30 submissions per hour to prevent spam.
    """
    scope = 'submissions'


class AuthRateThrottle(AnonRateThrottle):
    """
    Throttle for authentication endpoints.
    Limits to 3-4 attempts per minute per IP to prevent brute force attacks.
    """
    scope = 'auth'


class LoginRateThrottle(AnonRateThrottle):
    """
    Strict throttle for login endpoint.
    Limits to 4 login attempts per minute per IP.
    """
    scope = 'login'
