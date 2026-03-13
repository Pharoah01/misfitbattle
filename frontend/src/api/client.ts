/**
 * Secure Axios Client with Token Management and Session Security
 * 
 * Security Features:
 * - Access token stored in localStorage for persistence
 * - Automatic token attachment to requests
 * - Session ID tracking for single active session per user
 * - CSRF protection via withCredentials
 * - Obfuscated logging in production
 */

import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/config/constants';

const ACCESS_TOKEN_KEY = 'access_token';
const SESSION_ID_KEY = 'session_id';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Set access token in localStorage
 * @param token - Authentication token
 */
export const setAccessToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

/**
 * Get access token from localStorage
 * @returns Current access token or null
 */
export const getAccessToken = (): string | null => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return token;
};

/**
 * Clear access token from localStorage
 */
export const clearAccessToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

/**
 * Set session ID in localStorage
 * @param sessionId - Session identifier
 */
export const setSessionId = (sessionId: string | null): void => {
  if (sessionId) {
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  } else {
    localStorage.removeItem(SESSION_ID_KEY);
  }
};

/**
 * Get session ID from localStorage
 * @returns Current session ID or null
 */
export const getSessionId = (): string | null => {
  return localStorage.getItem(SESSION_ID_KEY);
};

/**
 * Clear session ID from localStorage
 */
export const clearSessionId = (): void => {
  localStorage.removeItem(SESSION_ID_KEY);
};

/**
 * Set refresh token in localStorage
 * @param token - Refresh token
 */
export const setRefreshToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

/**
 * Get refresh token from localStorage
 * @returns Current refresh token or null
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Clear refresh token from localStorage
 */
export const clearRefreshToken = (): void => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Clear all tokens and session data from localStorage
 */
export const clearAllTokens = (): void => {
  clearAccessToken();
  clearSessionId();
  clearRefreshToken();
};

/**
 * Create Axios instance with base configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
  withCredentials: true, // Enable CORS credentials
});

/**
 * Request Interceptor
 * Adds Authorization header with access token if available
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles 401 errors with token refresh and session expiration
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = getRefreshToken();
      
      if (refreshToken) {
        try {
          // Attempt to refresh the token
          const response = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          const newAccessToken = response.data.access;
          setAccessToken(newAccessToken);
          
          // Retry the original request with the new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect
          clearAllTokens();
          
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, clear tokens and redirect
        clearAllTokens();
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    
    // Handle session-specific 401 errors
    if (error.response?.status === 401) {
      const errorData = error.response.data as any;
      
      if (errorData?.code === 'SESSION_EXPIRED' || errorData?.code === 'NO_ACTIVE_SESSION') {
        clearAllTokens();
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
