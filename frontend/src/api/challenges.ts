/**
 * Challenge API Service
 * Handles all challenge-related API calls
 */

import apiClient from './client';
import type { Challenge, ChallengeQueryParams } from '@/types';

/**
 * Fetch all challenges with optional filters
 */
export const fetchChallenges = async (params?: ChallengeQueryParams): Promise<Challenge[]> => {
  const response = await apiClient.get<any>('/api/challenges/', { params });
  
  if (response.data && typeof response.data === 'object' && 'results' in response.data) {
    return response.data.results;
  }
  
  return response.data;
};

/**
 * Fetch a single challenge by ID or slug
 */
export const fetchChallenge = async (idOrSlug: string | number): Promise<Challenge> => {
  const response = await apiClient.get<Challenge>(`/api/challenges/${idOrSlug}/`);
  return response.data;
};

/**
 * Create a new challenge (admin only)
 */
export const createChallenge = async (data: Omit<Challenge, 'id' | 'created_at'>): Promise<Challenge> => {
  const response = await apiClient.post<Challenge>('/api/challenges/', data);
  return response.data;
};

/**
 * Update an existing challenge (admin only)
 */
export const updateChallenge = async (id: number, data: Partial<Challenge>): Promise<Challenge> => {
  const response = await apiClient.put<Challenge>(`/api/challenges/${id}/`, data);
  return response.data;
};

/**
 * Delete a challenge (admin only)
 */
export const deleteChallenge = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/challenges/${id}/`);
};
