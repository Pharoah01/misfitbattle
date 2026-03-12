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
import { obfuscateForLogging } from '@/utils/security';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const SESSION_ID_KEY = 'session_id';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Set access token in localStorage
 * @param token - Authentication token
 */
export const setAccessToken = (token: string | null): void => {
  console.log('Token Storage: Setting access token', { 
    hasToken: !!token, 
    tokenPreview: obfuscateForLogging(token ? `${token.substring(0, 10)}...` : null)
  });
  
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    console.log('Token Storage: Token saved to localStorage');
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    console.log('Token Storage: Token removed from localStorage');
  }
};

/**
 * Get access token from localStorage
 * @returns Current access token or null
 */
export const getAccessToken = (): string | null => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  console.log('Token Storage: Getting access token', { 
    hasToken: !!token, 
    tokenPreview: obfuscateForLogging(token ? `${token.substring(0, 10)}...` : null)
  });
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
    
    console.log('API Request:', {
      endpoint: obfuscateForLogging(config.url),
      hasToken: !!token,
      method: config.method?.toUpperCase()
    });
    
    // Add Authorization header if token exists
    // Use Token format for Django Token authentication
    if (token && config.headers) {
      config.headers.Authorization = `Token ${token}`;
      console.log('API Request: Added Authorization header');
    } else {
      console.log('API Request: No token available, skipping Authorization header');
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', obfuscateForLogging(error));
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles 401 errors and session expiration
 */
apiClient.interceptors.response.use(
  (response) => {
    // Success response - return as is
    console.log('API Response Success:', {
      endpoint: obfuscateForLogging(response.config.url),
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  async (error: AxiosError) => {
    console.error('API Response Error:', {
      endpoint: obfuscateForLogging(error.config?.url),
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: obfuscateForLogging(error.response?.data)
    });
    
    // Check if error is 401 Unauthorized or session-related
    if (error.response?.status === 401) {
      const errorData = error.response.data as any;
      
      console.log('API: 401 Unauthorized detected, clearing tokens');
      
      // Handle session expiration or no active session
      if (errorData?.code === 'SESSION_EXPIRED' || errorData?.code === 'NO_ACTIVE_SESSION') {
        // Clear all session data
        clearAllTokens();
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } else {
        // Regular 401 - clear tokens but let AuthContext handle navigation
        clearAllTokens();
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
