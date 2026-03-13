/**
 * React Query Configuration
 * 
 * Features:
 * - Sensible cache times
 * - Retry policies
 * - Global error handling
 * - Stale-while-revalidate strategy
 */

import { QueryClient } from '@tanstack/react-query';
import { CACHE_TIME } from './constants';

/**
 * Create and configure React Query client
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401) {
          return false;
        }
        if (error?.response?.status === 403) {
          return false;
        }
        if (error?.response?.status === 404) {
          return false;
        }
        return failureCount < 2;
      },
      
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      staleTime: 30 * 1000, // 30 seconds
      
      gcTime: CACHE_TIME.CHALLENGES,
      
      refetchOnWindowFocus: false,
      
      refetchOnReconnect: true,
      
      refetchOnMount: true,
    },
    mutations: {
      retry: false, // Don't retry mutations by default
      
      onError: () => {
      },
    },
  },
});

/**
 * Query keys for consistent cache management
 */
export const queryKeys = {
  currentUser: ['auth', 'me'] as const,
  
  challenges: ['challenges'] as const,
  challenge: (id: number) => ['challenges', id] as const,
  
  submissions: ['submissions'] as const,
  submission: (id: number) => ['submissions', id] as const,
  userSubmissions: (userId: number) => ['submissions', 'user', userId] as const,
  challengeSubmissions: (challengeId: number) => ['submissions', 'challenge', challengeId] as const,
} as const;
