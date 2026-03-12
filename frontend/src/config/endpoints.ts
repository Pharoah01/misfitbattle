/**
 * Obfuscated API Endpoints
 * Maps internal keys to actual API endpoints for security
 */

// Obfuscated endpoint mapping - makes it harder for users to discover API structure
const ENDPOINT_MAP = {
  // Authentication endpoints
  A1: '/api/auth/signin/',
  A2: '/api/auth/signup/', 
  A3: '/api/auth/signout/',
  A4: '/api/auth/me/',
  A5: '/api/auth/token/refresh/',
  
  // Challenge endpoints
  C1: '/api/challenges/',
  C2: (slug: string) => `/api/challenges/${slug}/`,
  
  // Submission endpoints  
  S1: '/api/submissions/',
  S2: (id: number) => `/api/submissions/${id}/`,
} as const;

/**
 * Get obfuscated endpoint by key
 * @param key - Endpoint key
 * @param params - Optional parameters for dynamic endpoints
 * @returns API endpoint URL
 */
export const getEndpoint = (key: keyof typeof ENDPOINT_MAP, ...params: any[]): string => {
  const endpoint = ENDPOINT_MAP[key];
  
  if (typeof endpoint === 'function') {
    return (endpoint as any)(...params);
  }
  
  return endpoint as string;
};

/**
 * Validate endpoint key exists
 * @param key - Endpoint key to validate
 * @returns True if key exists
 */
export const isValidEndpoint = (key: string): key is keyof typeof ENDPOINT_MAP => {
  return key in ENDPOINT_MAP;
};

// Export endpoint keys for type safety
export type EndpointKey = keyof typeof ENDPOINT_MAP;

// Development helper - remove in production
if (import.meta.env.DEV) {
  console.log('Available endpoint keys:', Object.keys(ENDPOINT_MAP));
}