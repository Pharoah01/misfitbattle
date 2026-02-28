/**
 * Application Constants
 * Centralized configuration for the application
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/auth/register/',
    LOGIN: '/api/auth/login/',
    LOGOUT: '/api/auth/logout/',
    ME: '/api/auth/me/',
    REFRESH: '/api/auth/token/refresh/',
  },
  CHALLENGES: {
    LIST: '/api/challenges/',
    DETAIL: (id: number) => `/api/challenges/${id}/`,
  },
  SUBMISSIONS: {
    CREATE: '/api/submissions/',
    LIST: '/api/submissions/',
    DETAIL: (id: number) => `/api/submissions/${id}/`,
  },
} as const;

// Token Configuration
export const TOKEN_CONFIG = {
  ACCESS_TOKEN_LIFETIME: 15 * 60 * 1000, // 15 minutes in milliseconds
  REFRESH_TOKEN_LIFETIME: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  REFRESH_THRESHOLD: 5 * 60 * 1000, // Refresh 5 minutes before expiry
} as const;

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
