/**
 * Custom hook for challenge data management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchChallenges, fetchChallenge, createChallenge, updateChallenge, deleteChallenge } from '@/api/challenges';
import { QUERY_KEYS, CACHE_TIME } from '@/config/constants';
import type { Challenge, ChallengeQueryParams } from '@/types';
import { toast } from '@/utils';

/**
 * Hook to fetch all challenges with optional filters
 */
export const useChallenges = (params?: ChallengeQueryParams) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHALLENGES, params],
    queryFn: () => fetchChallenges(params),
    staleTime: CACHE_TIME.CHALLENGES,
  });
};

/**
 * Hook to fetch a single challenge by ID or slug
 */
export const useChallenge = (idOrSlug: string | number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHALLENGES, idOrSlug],
    queryFn: () => fetchChallenge(idOrSlug),
    staleTime: CACHE_TIME.CHALLENGE_DETAIL,
    enabled: !!idOrSlug,
  });
};

/**
 * Hook to create a new challenge (admin only)
 */
export const useCreateChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHALLENGES] });
      toast.success('Challenge created successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to create challenge';
      toast.error(errorMessage);
    },
  });
};

/**
 * Hook to update an existing challenge (admin only)
 */
export const useUpdateChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Challenge> }) => 
      updateChallenge(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHALLENGES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHALLENGES, variables.id] });
      toast.success('Challenge updated successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to update challenge';
      toast.error(errorMessage);
    },
  });
};

/**
 * Hook to delete a challenge (admin only)
 */
export const useDeleteChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHALLENGES] });
      toast.success('Challenge deleted successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to delete challenge';
      toast.error(errorMessage);
    },
  });
};
