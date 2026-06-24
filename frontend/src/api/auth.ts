/**
 * Authentication API Service
 * Handles all authentication-related API calls
 * 
 * Uses HTPID (Hack The Planet ID) for identification instead of register numbers.
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
 * Register a new user using HTPID
 * Backend verifies HTPID against HTP API and fetches participant details automatically.
 * 
 * @param data - Registration form data (htp_id + password)
 * @returns Registered user data with token
 */
export const register = async (data: RegisterFormData): Promise<RegisterResponse> => {
  const response = await apiClient.post<RegisterResponse>(
    API_ENDPOINTS.AUTH.REGISTER,
    {
      htp_id: data.htp_id.trim().toUpperCase(),
      password: data.password,
    }
  );
  
  // Set token on successful registration
  setAccessToken(response.data.token);
  
  return response.data;
};

/**
 * Login user with HTPID and password
 * @param data - Login credentials (htp_id + password)
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
      htp_id: data.htp_id.trim().toUpperCase(),
      password: data.password,
    }
  );
  
  setAccessToken(response.data.token);
  
  return {
    access: response.data.token,
    refresh: '',
    user: response.data.user,
    session_id: response.data.session_id,
    session_info: response.data.session_info,
  };
};

/**
 * Logout user and clear tokens
 * Backend invalidates session and token
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
 * @returns Current access token
 */
export const refreshToken = async (): Promise<string> => {
  try {
    await getCurrentUser();
    return '';
  } catch (error) {
    clearAccessToken();
    throw error;
  }
};
