from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Allow users to view their own submissions.
    Allow admins to view all submissions.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        
        return obj.user == request.user
