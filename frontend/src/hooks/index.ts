/**
 * Central export for all custom hooks
 */

// Re-export useAuth from contexts
export { useAuth } from '@/contexts';

// Challenge hooks
export { useChallenges, useChallenge, useCreateChallenge, useUpdateChallenge, useDeleteChallenge } from './useChallenges';

// Submission hooks
export { useSubmissions, useSubmission, useSubmitSolution } from './useSubmissions';
