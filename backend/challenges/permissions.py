from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Allow read access to everyone (including unauthenticated users).
    Allow write access only to admin users.
    """
    def has_permission(self, request, view):
        # Allow read access to everyone
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write access only for authenticated admins
        return request.user and request.user.is_authenticated and request.user.is_admin
