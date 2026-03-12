/**
 * Custom hooks for submission data management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submitSolution, fetchSubmissions, fetchSubmission } from '@/api/submissions';
import { QUERY_KEYS, CACHE_TIME } from '@/config/constants';
import type { SubmissionFormData } from '@/types';
import { toast } from '@/utils';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to fetch user's submissions
 */
export const useSubmissions = (challengeId?: number) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [QUERY_KEYS.SUBMISSIONS, user?.id, challengeId],
    queryFn: () => fetchSubmissions(challengeId),
    staleTime: CACHE_TIME.SUBMISSIONS,
    enabled: !!user, // Only fetch when user is available
    // Ensure fresh data for each user by making queries user-specific
    gcTime: 0, // Don't cache data after component unmounts
  });
};

/**
 * Hook to fetch a single submission
 */
export const useSubmission = (id: number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SUBMISSIONS, id],
    queryFn: () => fetchSubmission(id),
    enabled: !!id,
  });
};

/**
 * Hook to submit a solution
 */
export const useSubmitSolution = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: SubmissionFormData) => submitSolution(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUBMISSIONS, user?.id] });
      // Toast is handled by the component for better context-specific messages
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.html_code?.[0] ||
                          error.response?.data?.css_code?.[0] ||
                          'Failed to submit solution';
      toast.error(errorMessage);
    },
  });
};
