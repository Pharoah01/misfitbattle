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
import { useQueryClient } from '@tanstack/react-query';
import * as authAPI from '@/api/auth';
import { getAccessToken, clearAllTokens, setSessionId } from '@/api/client';
import { QUERY_KEYS } from '@/config/constants';
import type { User, LoginFormData, RegisterFormData } from '@/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  sessionInfo: any | null;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  registerAutoSubmit: (callback: (() => Promise<void>) | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSubmitCallbackRef = React.useRef<(() => Promise<void>) | null>(null);

  /**
   * Register auto-submit callback from ChallengePage
   * This allows the auth context to trigger auto-submit before logout
   */
  const registerAutoSubmit = useCallback((callback: (() => Promise<void>) | null) => {
    autoSubmitCallbackRef.current = callback;
  }, []);

  /**
   * Reset inactivity timer
   */
  const resetInactivityTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (user) {
      timeoutRef.current = setTimeout(async () => {
        if (autoSubmitCallbackRef.current) {
          try {
            await autoSubmitCallbackRef.current();
          } catch (error) {
          }
        }
        
        await logout();
      }, SESSION_TIMEOUT);
    }
  }, [user]);

  /**
   * Track user activity
   */
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    resetInactivityTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user, resetInactivityTimer]);

  /**
   * Restore session on mount
   * Attempts to get current user if token exists
   */
  const restoreSession = useCallback(async () => {
    try {
      setLoading(true);
      
      const token = getAccessToken();
      
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      } catch (error) {
        setUser(null);
        setSessionInfo(null);
        clearAllTokens();
      }
    } catch (err) {
      setUser(null);
      setSessionInfo(null);
      clearAllTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      if (mounted) {
        await restoreSession();
      }
    };
    
    initAuth();
    
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  /**
   * Clear submissions cache when user changes
   * This prevents cross-user data contamination
   */
  useEffect(() => {
    queryClient.invalidateQueries({ 
      queryKey: [QUERY_KEYS.SUBMISSIONS],
      exact: false // This will invalidate all submission-related queries
    });
  }, [user?.id, queryClient]); // Trigger when user ID changes

  /**
   * Login user
   * @param data - Login credentials
   */
  const login = useCallback(async (data: LoginFormData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      queryClient.clear();
      
      const response = await authAPI.login(data);
      setUser(response.user);
      
      if (response.session_id) {
        setSessionId(response.session_id);
      }
      if (response.session_info) {
        setSessionInfo(response.session_info);
      }
      
      navigate('/profile');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.non_field_errors?.[0] ||
                          'Login failed. Please check your credentials.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [navigate, queryClient]);

  /**
   * Register new user
   * @param data - Registration form data
   */
  const register = useCallback(async (data: RegisterFormData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await authAPI.register(data);
      
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
      
      await authAPI.logout();
    } catch (err) {
    } finally {
      setUser(null);
      setSessionInfo(null);
      clearAllTokens();
      
      queryClient.clear();
      
      setLoading(false);
      
      navigate('/login');
    }
  }, [navigate, queryClient]);

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
      throw err;
    }
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false,
    loading,
    error,
    sessionInfo,
    login,
    register,
    logout,
    refreshUser,
    clearError,
    registerAutoSubmit,
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
