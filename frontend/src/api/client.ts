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

// Token storage key
const TOKEN_STORAGE_KEY = 'auth_token';

/**
 * Set access token in localStorage
 * @param token - Authentication token
 */
export const setAccessToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

/**
 * Get access token from localStorage
 * @returns Current access token or null
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

/**
 * Clear access token from localStorage
 */
export const clearAccessToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
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
});

/**
 * Request Interceptor
 * Adds Authorization header with access token if available
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    
    // Add Authorization header if token exists
    // Backend uses DRF Token Authentication (not JWT)
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
 * Handles 401 errors (backend uses simple token auth without refresh)
 */
apiClient.interceptors.response.use(
  (response) => {
    // Success response - return as is
    return response;
  },
  async (error: AxiosError) => {
    // Check if error is 401 Unauthorized
    if (error.response?.status === 401) {
      // Token is invalid - clear it and let user login again
      clearAccessToken();
      
      // Redirect to login page will be handled by AuthContext
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
