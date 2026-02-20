// Core data models for the CSSBattle application

/**
 * User model representing an authenticated user
 */
export interface User {
  id: number;
  register_number: string;
  name: string;
  email?: string;
  is_admin: boolean;
  created_at: string;
}

/**
 * Challenge model representing a CSS/HTML coding challenge
 */
export interface Challenge {
  id: number;
  title: string;
  description: string;
  html_boilerplate: string;
  css_boilerplate: string;
  points: number;
  created_at: string;
}

/**
 * Submission model representing a user's solution to a challenge
 */
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
  submitted_at: string;
}

/**
 * Leaderboard entry representing a user's ranking and statistics
 */
export interface LeaderboardEntry {
  rank: number;
  register_number: string;
  name: string;
  total_points: number;
  solved_count: number;
}

/**
 * Authentication request data for user sign up
 */
export interface SignUpData {
  register_number: string;
  name: string;
  email?: string;
  password: string;
}

/**
 * Authentication request data for user sign in
 */
export interface SignInData {
  register_number: string;
  password: string;
}

/**
 * Authentication response containing tokens and user data
 */
export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

/**
 * Token refresh request data
 */
export interface TokenRefreshData {
  refresh: string;
}

/**
 * Token refresh response containing new access token
 */
export interface TokenRefreshResponse {
  access: string;
}

/**
 * Challenge creation request data (admin only)
 */
export interface CreateChallengeData {
  title: string;
  description: string;
  html_boilerplate: string;
  css_boilerplate: string;
  points: number;
}

/**
 * Challenge update request data (admin only)
 */
export interface UpdateChallengeData {
  title?: string;
  description?: string;
  html_boilerplate?: string;
  css_boilerplate?: string;
  points?: number;
}

/**
 * Solution submission request data
 */
export interface SubmitSolutionData {
  challenge: number;
  html_code: string;
  css_code: string;
}

/**
 * Query parameters for fetching challenges
 */
export interface ChallengeQueryParams {
  search?: string;
  points__gte?: number;
  ordering?: 'created_at' | '-created_at' | 'points' | '-points';
}

/**
 * Query parameters for fetching submissions
 */
export interface SubmissionQueryParams {
  challenge?: number;
  ordering?: 'submitted_at' | '-submitted_at' | 'code_length' | '-code_length';
}

/**
 * API error response structure
 */
export interface ApiError {
  message: string;
  status: number;
  data?: any;
}

/**
 * Form state for sign up page
 */
export interface SignUpFormState {
  register_number: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Form state for sign in page
 */
export interface SignInFormState {
  register_number: string;
  password: string;
  rememberMe: boolean;
}

/**
 * Form state for challenge creation/editing (admin)
 */
export interface ChallengeFormState {
  title: string;
  description: string;
  html_boilerplate: string;
  css_boilerplate: string;
  points: number;
}

/**
 * State for code editor component
 */
export interface CodeEditorState {
  htmlCode: string;
  cssCode: string;
  codeLength: number;
  hasUnsavedChanges: boolean;
}
