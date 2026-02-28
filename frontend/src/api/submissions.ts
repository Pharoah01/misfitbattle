/**
 * Submission API Service
 * Handles all submission-related API calls
 */

import apiClient from './client';
import type { Submission, SubmissionFormData } from '@/types';

/**
 * Submit a solution for a challenge
 */
export const submitSolution = async (data: SubmissionFormData): Promise<Submission> => {
  const response = await apiClient.post<Submission>('/api/submissions/', data);
  return response.data;
};

/**
 * Fetch user's submissions
 */
export const fetchSubmissions = async (challengeId?: number): Promise<Submission[]> => {
  const params = challengeId ? { challenge: challengeId } : {};
  const response = await apiClient.get<Submission[]>('/api/submissions/', { params });
  return response.data;
};

/**
 * Fetch a single submission by ID
 */
export const fetchSubmission = async (id: number): Promise<Submission> => {
  const response = await apiClient.get<Submission>(`/api/submissions/${id}/`);
  return response.data;
};

/**
 * Delete a submission
 */
export const deleteSubmission = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/submissions/${id}/`);
};
