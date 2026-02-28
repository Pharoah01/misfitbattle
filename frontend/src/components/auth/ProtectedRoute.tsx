/**
 * Protected Route Component
 * 
 * Security Features:
 * - Prevents unauthenticated access
 * - Optional admin-only routes
 * - No route flashing (shows loading state)
 * - Automatic redirect to login
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  // This prevents route flashing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    // Redirect to login, preserving the attempted location
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    // Redirect to dashboard if user is not admin
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated (and admin if required)
  return <>{children}</>;
};
