/**
 * Protected Route Component
 * 
 * Security Features:
 * - Prevents unauthenticated access
 * - Optional admin-only routes
 * - Profile completion enforcement
 * - No route flashing (shows loading state)
 * - Automatic redirect to login
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireProfileCompletion?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireProfileCompletion = true,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, isAdmin, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary font-rajdhani">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requireProfileCompletion && user && !user.profile_completed) {
    const currentPath = location.pathname;
    if (currentPath !== '/profile' && currentPath !== '/edit-profile') {
      return <Navigate to="/profile" replace />;
    }
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
