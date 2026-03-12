/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import apiClient, { setAccessToken, clearAccessToken } from './client';
import { API_ENDPOINTS } from '@/config/constants';
import type {
  LoginFormData,
  RegisterFormData,
  LoginResponse,
  RegisterResponse,
  User,
} from '@/types';

/**
 * Register a new user
 * @param data - Registration form data
 * @returns Registered user data
 */
export const register = async (data: RegisterFormData): Promise<RegisterResponse> => {
  const response = await apiClient.post<RegisterResponse>(
    API_ENDPOINTS.AUTH.REGISTER,
    {
      register_number: data.register_number,
      name: data.name,
      email: data.email,
      password: data.password,
    }
  );
  return response.data;
};

/**
 * Login user and store access token
 * @param data - Login credentials
 * @returns Login response with token and user data
 */
export const login = async (data: LoginFormData): Promise<LoginResponse> => {
  console.log('Auth API: Starting login request');
  
  const response = await apiClient.post<{ 
    token: string; 
    session_id: string;
    user: User;
    session_info: {
      ip_address: string;
      country: string;
      city: string;
      created_at: string;
    };
  }>(
    API_ENDPOINTS.AUTH.LOGIN,
    {
      register_number: data.register_number,
      password: data.password,
    }
  );
  
  console.log('Auth API: Login response received', {
    hasToken: !!response.data.token,
    tokenPreview: response.data.token ? `${response.data.token.substring(0, 10)}...` : null,
    user: response.data.user
  });
  
  // Store token in localStorage (backend uses simple token auth, not JWT)
  setAccessToken(response.data.token);
  
  console.log('Auth API: Token stored in localStorage');
  
  return {
    access: response.data.token,
    refresh: '', // Backend uses DRF Token Auth (no refresh token)
    user: response.data.user,
    session_id: response.data.session_id,
    session_info: response.data.session_info,
  };
};

/**
 * Logout user and clear tokens
 * Backend invalidates refresh token
 */
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  } finally {
    // Always clear access token, even if logout request fails
    clearAccessToken();
  }
};

/**
 * Get current authenticated user
 * @returns Current user data
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
  return response.data;
};

/**
 * Refresh access token
 * Note: Backend uses simple token auth without refresh mechanism
 * This function is kept for compatibility but doesn't actually refresh
 * @returns Current access token
 */
export const refreshToken = async (): Promise<string> => {
  // Backend uses DRF Token Authentication which doesn't expire
  // No refresh needed - just verify current user is still valid
  try {
    await getCurrentUser();
    // If getCurrentUser succeeds, token is still valid
    return ''; // Token is already set in client
  } catch (error) {
    // Token is invalid, user needs to login again
    clearAccessToken();
    throw error;
  }
};
