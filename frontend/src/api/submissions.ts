/**
 * Submission API Service
 * Handles all submission-related API calls
 */

import apiClient from './client';
import type { Submission, SubmissionFormData, SubmissionsResponse } from '@/types';

/**
 * Submit a solution for a challenge
 */
export const submitSolution = async (data: SubmissionFormData & { is_auto_save?: boolean }): Promise<Submission> => {
  const response = await apiClient.post<Submission>('/api/submissions/', data);
  return response.data;
};

/**
 * Fetch user's submissions
 */
export const fetchSubmissions = async (challengeId?: number): Promise<Submission[]> => {
  try {
    const params = challengeId ? { challenge: challengeId } : {};
    const response = await apiClient.get<SubmissionsResponse>('/api/submissions/', { params });

    // Enhanced response type detection with robust validation
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      // Check if it's a paginated response structure
      if ('results' in response.data && Array.isArray(response.data.results)) {
        console.log('fetchSubmissions: Detected paginated response format', {
          resultsCount: response.data.results.length,
          responseKeys: Object.keys(response.data)
        });
        return response.data.results;
      }

      // Handle case where response.data is an object but not paginated
      console.warn('fetchSubmissions: Unexpected response format - object without results array', {
        responseKeys: Object.keys(response.data),
        responseType: typeof response.data
      });
      return [];
    }

    // Handle direct array response
    if (Array.isArray(response.data)) {
      console.log('fetchSubmissions: Detected direct array response format', {
        submissionsCount: response.data.length
      });
      return response.data;
    }

    // Handle null/undefined response
    if (response.data === null || response.data === undefined) {
      console.warn('fetchSubmissions: Received null/undefined response data');
      return [];
    }

    // Fallback for unexpected response types
    console.error('fetchSubmissions: Unexpected response data type', {
      dataType: typeof response.data,
      data: response.data
    });
    return [];

  } catch (error) {
    console.error('fetchSubmissions: API call failed', error);
    // Return empty array on error to prevent client-side filtering fallback
    return [];
  }
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
