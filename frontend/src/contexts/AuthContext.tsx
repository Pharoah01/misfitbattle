/**
 * Authentication Context
 * 
 * Security Features:
 * - Access token stored in memory only (React state)
 * - Refresh token in HttpOnly cookie (managed by browser)
 * - Automatic session restoration on mount
 * - Secure logout with backend invalidation
 * - No token exposure to localStorage
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authAPI from '@/api/auth';
import { setAccessToken, clearAccessToken } from '@/api/client';
import type { User, LoginFormData, RegisterFormData } from '@/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  /**
   * Restore session on mount
   * Attempts to get current user if token exists
   */
  const restoreSession = useCallback(async () => {
    try {
      setLoading(true);
      
      // Backend uses simple token auth (no refresh token)
      // Just try to get current user - if it fails, user needs to login
      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      } catch (error) {
        // No valid token - user needs to login
        setUser(null);
        clearAccessToken();
      }
    } catch (err) {
      // Session restoration failed - user needs to login
      setUser(null);
      clearAccessToken();
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  /**
   * Login user
   * @param data - Login credentials
   */
  const login = useCallback(async (data: LoginFormData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.login(data);
      setUser(response.user);
      
      // Navigate to dashboard on successful login
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.non_field_errors?.[0] ||
                          'Login failed. Please check your credentials.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  /**
   * Register new user
   * @param data - Registration form data
   */
  const register = useCallback(async (data: RegisterFormData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await authAPI.register(data);
      
      // After successful registration, login automatically
      await login({
        register_number: data.register_number,
        password: data.password,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.register_number?.[0] ||
                          err.response?.data?.detail ||
                          'Registration failed. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [login]);

  /**
   * Logout user
   * Clears access token and invalidates refresh token on backend
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Call backend logout to invalidate refresh token
      await authAPI.logout();
    } catch (err) {
      // Even if logout fails, clear local state
      console.error('Logout error:', err);
    } finally {
      // Clear user state and access token
      setUser(null);
      clearAccessToken();
      setLoading(false);
      
      // Navigate to login page
      navigate('/login');
    }
  }, [navigate]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh user data
   * Fetches current user data from backend
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error('Failed to refresh user data:', err);
      throw err;
    }
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use auth context
 * @returns Auth context value
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
