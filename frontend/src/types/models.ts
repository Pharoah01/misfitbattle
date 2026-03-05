/**
 * Type definitions for API models
 * These match the backend Django models
 */

// User Model
export interface User {
  id: number;
  register_number: string;
  name: string;
  email?: string;
  college_name?: string;
  profile_completed: boolean;
  is_admin: boolean;
  created_at: string;
}

// Challenge Model
export interface Challenge {
  id: number;
  title: string;
  slug: string | null; // URL-friendly identifier
  description: string;
  html_boilerplate: string;
  css_boilerplate: string;
  palette: string[]; // Array of hex colors (read-only)
  preview_image: string | null; // Image URL
  points: number;
  created_at: string;
}

// Challenge Query Parameters
export interface ChallengeQueryParams {
  search?: string;
  ordering?: 'points' | '-points' | 'created_at' | '-created_at';
  points__gte?: number;
  points__lte?: number;
}

// Submission Model
export interface Submission {
  id: number;
  user: number;
  user_name: string;
  user_register_number: string;
  challenge: number;
  challenge_title: string;
  html_code: string;
  css_code: string;
  code_length: number;
  rendered_image?: string | null;
  similarity_score?: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string | null;
  submitted_at: string;
}

// Auth Response Models
export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterResponse {
  id: number;
  register_number: string;
  name: string;
  is_admin: boolean;
  created_at: string;
}

// API Error Response
export interface APIError {
  detail?: string;
  [key: string]: string | string[] | undefined;
}

// Form Data Types
export interface LoginFormData {
  register_number: string;
  password: string;
}

export interface RegisterFormData {
  register_number: string;
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface SubmissionFormData {
  challenge: number;
  html_code: string;
  css_code: string;
}
