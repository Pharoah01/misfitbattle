/**
 * Application-wide constants and configuration
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Authentication
export const TOKEN_STORAGE_KEY = 'access_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';

// Code Editor
export const MAX_CODE_LENGTH = 10000;
export const CODE_LENGTH_WARNING_THRESHOLD = 9000;

// Debounce Delays (in milliseconds)
export const LIVE_PREVIEW_DEBOUNCE_DELAY = 300;
export const SEARCH_INPUT_DEBOUNCE_DELAY = 500;
export const AUTO_SAVE_DEBOUNCE_DELAY = 1000;

// Toast Notifications
export const TOAST_DEFAULT_DURATION = 3000;

// React Query Cache Times (in milliseconds)
export const CACHE_TIME = {
  CHALLENGES: 5 * 60 * 1000, // 5 minutes
  CHALLENGE_DETAIL: 10 * 60 * 1000, // 10 minutes
  SUBMISSIONS: 2 * 60 * 1000, // 2 minutes
  LEADERBOARD: 30 * 1000, // 30 seconds
};

// Leaderboard
export const LEADERBOARD_REFETCH_INTERVAL = 30000; // 30 seconds
export const VIRTUAL_SCROLL_THRESHOLD = 100; // Enable virtual scrolling for 100+ entries

// Responsive Breakpoints (matches Tailwind defaults)
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 1024,
};

// Validation Patterns
export const VALIDATION_PATTERNS = {
  REGISTER_NUMBER: /^[a-zA-Z0-9]{3,20}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'You don\'t have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  RATE_LIMIT: 'Too many requests. Please wait and try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  SIGN_UP: 'Account created successfully!',
  SIGN_IN: 'Signed in successfully!',
  SIGN_OUT: 'Signed out successfully!',
  SUBMISSION: 'Solution submitted successfully!',
  CHALLENGE_CREATED: 'Challenge created successfully!',
  CHALLENGE_UPDATED: 'Challenge updated successfully!',
  CHALLENGE_DELETED: 'Challenge deleted successfully!',
  SUBMISSION_DELETED: 'Submission deleted successfully!',
};
