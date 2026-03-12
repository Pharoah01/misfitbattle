/**
 * Type definitions for API models - Difficulty Levels Feature
 */

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

export interface Challenge {
  id: number;
  title: string;
  slug: string | null;
  description: string;
  html_boilerplate: string;
  css_boilerplate: string;
  palette: string[];
  preview_image: string | null;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
}

export interface ChallengeQueryParams {
  search?: string;
  ordering?: 'points' | '-points' | 'created_at' | '-created_at';
  points__gte?: number;
  points__lte?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Submission {
  id: number;
  user: number;
  user_name: string;
  user_register_number: string;
  user_email?: string;
  challenge: number;
  challenge_title: string;
  html_code: string;
  css_code: string;
  code_length: number;
  rendered_image?: string | null;
  similarity_score?: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string | null;
  is_auto_save?: boolean;
  submission_count?: number;
  submitted_at: string;
}

export interface LoginResponse {
  session_id: string;
  session_info: {
    ip_address: string;
    country: string;
    city: string;
    created_at: string;
  };
  access: string;
  refresh: string;
  user: User;
}

export interface AuthResponse {
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

export interface APIError {
  detail?: string;
  [key: string]: string | string[] | undefined;
}

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
  is_auto_save?: boolean;
}
/**
 * Paginated API response structure
 */
export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

/**
 * Specific type for paginated submissions response
 */
export type SubmissionsResponse = Submission[] | PaginatedResponse<Submission>;
