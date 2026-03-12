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
      // Retry failed requests
      retry: (failureCount, error: any) => {
        // Don't retry on 401 (handled by axios interceptor)
        if (error?.response?.status === 401) {
          return false;
        }
        // Don't retry on 403 (forbidden)
        if (error?.response?.status === 403) {
          return false;
        }
        // Don't retry on 404 (not found)
        if (error?.response?.status === 404) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Stale time - data considered fresh for this duration
      staleTime: 30 * 1000, // 30 seconds
      
      // Cache time - data kept in cache for this duration
      gcTime: CACHE_TIME.CHALLENGES,
      
      // Refetch on window focus
      refetchOnWindowFocus: false,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Refetch on mount
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations
      retry: false, // Don't retry mutations by default
      
      // Global mutation error handler
      onError: () => {
        // Error handling can be done here if needed
      },
    },
  },
});

/**
 * Query keys for consistent cache management
 */
export const queryKeys = {
  // Auth
  currentUser: ['auth', 'me'] as const,
  
  // Challenges
  challenges: ['challenges'] as const,
  challenge: (id: number) => ['challenges', id] as const,
  
  // Submissions
  submissions: ['submissions'] as const,
  submission: (id: number) => ['submissions', id] as const,
  userSubmissions: (userId: number) => ['submissions', 'user', userId] as const,
  challengeSubmissions: (challengeId: number) => ['submissions', 'challenge', challengeId] as const,
} as const;
