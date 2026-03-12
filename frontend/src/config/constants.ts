/**
 * Application Constants
 * Centralized configuration for the application
 */

import { getEndpoint } from './endpoints';

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Obfuscated API endpoints - actual URLs are hidden from users
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: getEndpoint('A2'),
    LOGIN: getEndpoint('A1'),
    LOGOUT: getEndpoint('A3'),
    ME: getEndpoint('A4'),
    REFRESH: getEndpoint('A5'),
  },
  CHALLENGES: {
    LIST: getEndpoint('C1'),
    DETAIL: (slug: string) => getEndpoint('C2', slug),
  },
  SUBMISSIONS: {
    CREATE: getEndpoint('S1'),
    LIST: getEndpoint('S1'),
    DETAIL: (id: number) => getEndpoint('S2', id),
  },
} as const;

// Token Configuration
export const TOKEN_CONFIG = {
  ACCESS_TOKEN_LIFETIME: 15 * 60 * 1000, // 15 minutes in milliseconds
  REFRESH_TOKEN_LIFETIME: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  REFRESH_THRESHOLD: 5 * 60 * 1000, // Refresh 5 minutes before expiry
} as const;

// Token Storage Keys
export const TOKEN_STORAGE_KEY = 'access_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';

// Cache Configuration (React Query)
export const CACHE_TIME = {
  CHALLENGES: 5 * 60 * 1000, // 5 minutes
  CHALLENGE_DETAIL: 10 * 60 * 1000, // 10 minutes
  SUBMISSIONS: 2 * 60 * 1000, // 2 minutes
  USER: 10 * 60 * 1000, // 10 minutes
} as const;

// React Query Keys
export const QUERY_KEYS = {
  CHALLENGES: 'challenges',
  SUBMISSIONS: 'submissions',
  USER: 'user',
} as const;

// Validation Constants
export const VALIDATION = {
  MAX_CODE_LENGTH: 10000,
  REGISTER_NUMBER_PATTERN: /^[a-zA-Z0-9]{3,20}$/,
  PASSWORD_MIN_LENGTH: 8,
} as const;

// Legacy exports for backward compatibility
export const MAX_CODE_LENGTH = VALIDATION.MAX_CODE_LENGTH;

export const VALIDATION_PATTERNS = {
  REGISTER_NUMBER: VALIDATION.REGISTER_NUMBER_PATTERN,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access forbidden.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
} as const;

export const SUCCESS_MESSAGES = {
  SIGN_UP: 'Account created successfully!',
  SIGN_IN: 'Signed in successfully!',
  SUBMISSION: 'Submission created successfully!',
  CHALLENGE_CREATED: 'Challenge created successfully!',
} as const;

// UI Constants
export const UI = {
  TOAST_DURATION: 5000, // 5 seconds
  DEBOUNCE_DELAY: {
    SEARCH: 500,
    AUTO_SAVE: 1000,
    LIVE_PREVIEW: 300,
  },
} as const;

// Security Constants
export const SECURITY = {
  // Iframe sandbox policy - CSS-only rendering, no scripts
  IFRAME_SANDBOX: 'allow-same-origin',
  // CSRF protection
  CSRF_HEADER: 'X-CSRFToken',
} as const;
