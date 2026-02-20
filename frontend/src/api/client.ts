/**
 * Axios HTTP client instance with base configuration
 * 
 * Provides centralized HTTP client for all API requests with:
 * - Base URL configuration from environment variables
 * - CORS credentials support
 * - Default headers for JSON content
 * 
 * Requirements: 2.5, 16.1, 16.6
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

/**
 * Configured Axios instance for API requests
 * 
 * Configuration:
 * - baseURL: Set from VITE_API_URL environment variable
 * - withCredentials: Enabled for CORS cookie/credential handling
 * - Content-Type: Set to application/json for all requests
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor for authentication
 * 
 * Adds Authorization header with Bearer token to all requests
 * Reads token from localStorage and handles missing token gracefully
 * 
 * Requirements: 2.5
 */
apiClient.interceptors.request.use(
  (config) => {
    // Read token from localStorage
    const token = localStorage.getItem('access_token');
    
    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Handle request errors gracefully
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for token refresh
 * 
 * Catches 401 responses and attempts to refresh the access token
 * Retries the original request with the new token on success
 * Redirects to sign in on refresh failure
 * Prevents infinite retry loops with _retry flag
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.7, 11.2
 */
apiClient.interceptors.response.use(
  (response) => {
    // Pass through successful responses
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and request hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Mark request as retried to prevent infinite loops
      originalRequest._retry = true;
      
      try {
        // Get refresh token from localStorage
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          // No refresh token available, redirect to sign in
          localStorage.removeItem('access_token');
          window.location.href = '/signin';
          return Promise.reject(error);
        }
        
        // Attempt to refresh the access token
        const response = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
          refresh: refreshToken,
        });
        
        // Store the new access token
        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);
        
        // Update the Authorization header for the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Retry the original request with the new token
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Token refresh failed, clear tokens and redirect to sign in
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/signin';
        return Promise.reject(refreshError);
      }
    }
    
    // For all other errors, reject the promise
    return Promise.reject(error);
  }
);

export default apiClient;
