/**
 * Obfuscated API Endpoints - Security Feature
 */

const ENDPOINT_MAP = {
  A1: '/api/auth/signin/',
  A2: '/api/auth/signup/', 
  A3: '/api/auth/signout/',
  A4: '/api/auth/me/',
  A5: '/api/auth/token/refresh/',
  C1: '/api/challenges/',
  C2: (slug: string) => `/api/challenges/${slug}/`,
  S1: '/api/submissions/',
  S2: (id: number) => `/api/submissions/${id}/`,
} as const;

export const getEndpoint = (key: keyof typeof ENDPOINT_MAP, ...params: any[]): string => {
  const endpoint = ENDPOINT_MAP[key];
  
  if (typeof endpoint === 'function') {
    // Handle function endpoints with proper parameter passing
    if (key === 'C2') {
      return (endpoint as (slug: string) => string)(params[0] as string);
    }
    if (key === 'S2') {
      return (endpoint as (id: number) => string)(params[0] as number);
    }
  }
  
  return endpoint as string;
};

export const isValidEndpoint = (key: string): key is keyof typeof ENDPOINT_MAP => {
  return key in ENDPOINT_MAP;
};

export type EndpointKey = keyof typeof ENDPOINT_MAP;