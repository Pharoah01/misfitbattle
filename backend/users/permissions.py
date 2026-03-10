"""
Custom permissions for session security
"""

from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Permission class for admin users only
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_admin
        )