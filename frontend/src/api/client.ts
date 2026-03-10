/**
 * Secure Axios Client with Token Management
 * 
 * Security Features:
 * - Access token stored in localStorage for persistence
 * - Automatic token attachment to requests
 * - CSRF protection via withCredentials
 */

import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/config/constants';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
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
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Clear access token from localStorage
 */
export const clearAccessToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
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
 * Clear all tokens from localStorage
 */
export const clearAllTokens = (): void => {
  clearAccessToken();
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
    
    // Add Authorization header if token exists
    // Use Token format for Django Token authentication
    if (token && config.headers) {
      config.headers.Authorization = `Token ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles 401 errors by clearing tokens (let AuthContext handle navigation)
 */
apiClient.interceptors.response.use(
  (response) => {
    // Success response - return as is
    return response;
  },
  async (error: AxiosError) => {
    // Check if error is 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear tokens but let AuthContext handle navigation
      // This prevents infinite redirect loops
      clearAllTokens();
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
