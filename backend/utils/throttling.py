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
    Limits to 10 attempts per hour per IP to prevent brute force attacks.
    """
    scope = 'auth'
