/**
 * Custom hooks for submission data management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submitSolution, fetchSubmissions, fetchSubmission, deleteSubmission } from '@/api/submissions';
import { QUERY_KEYS, CACHE_TIME } from '@/config/constants';
import type { SubmissionFormData } from '@/types';
import { toast } from '@/utils';

/**
 * Hook to fetch user's submissions
 */
export const useSubmissions = (challengeId?: number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SUBMISSIONS, challengeId],
    queryFn: () => fetchSubmissions(challengeId),
    staleTime: CACHE_TIME.SUBMISSIONS,
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

  return useMutation({
    mutationFn: (data: SubmissionFormData) => submitSolution(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUBMISSIONS] });
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

/**
 * Hook to delete a submission
 */
export const useDeleteSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUBMISSIONS] });
      toast.success('Submission deleted successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to delete submission';
      toast.error(errorMessage);
    },
  });
};
