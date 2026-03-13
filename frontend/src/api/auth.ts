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
  
  setAccessToken(response.data.token);
  
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
  try {
    await getCurrentUser();
    return ''; // Token is already set in client
  } catch (error) {
    clearAccessToken();
    throw error;
  }
};
