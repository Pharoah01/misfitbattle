import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { fetchSubmissions } from './submissions';
import apiClient from './client';
import type { Submission } from '@/types';

/**
 * Property-Based Test: Bug Condition Exploration - Paginated Response Parsing Failure
 * 
 * **Validates: Requirements 1.3, 2.3**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * Property 1: Fault Condition - Paginated Response Parsing Failure
 * 
 * For any paginated API response where the backend returns submission data in the format 
 * `{results: Submission[]}`, the fetchSubmissions function SHALL correctly parse the 
 * response and extract only the authenticated user's submissions array.
 * 
 * This test encodes the expected behavior - it will validate the fix when it passes 
 * after implementation. The goal is to surface counterexamples that demonstrate 
 * the bug exists in the current unfixed code.
 */

describe('Property Test: Bug Condition Exploration - Paginated Response Parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Arbitrary generator for valid Submission objects
   */
  const submissionArbitrary: fc.Arbitrary<Submission> = fc.record({
    id: fc.integer({ min: 1, max: 100000 }),
    challenge: fc.integer({ min: 1, max: 1000 }),
    challenge_title: fc.string({ minLength: 5, maxLength: 50 }),
    user: fc.integer({ min: 1, max: 10000 }),
    user_name: fc.string({ minLength: 3, maxLength: 30 }),
    user_register_number: fc.string({ minLength: 5, maxLength: 15 }),
    html_code: fc.string({ minLength: 10, maxLength: 1000 }),
    css_code: fc.string({ minLength: 10, maxLength: 1000 }),
    status: fc.constantFrom('completed', 'pending', 'failed'),
    submitted_at: fc.string().map(() => new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()),
    is_auto_save: fc.boolean(),
    code_length: fc.integer({ min: 20, max: 2000 })
  });

  /**
   * Arbitrary generator for paginated API responses with submission arrays
   */
  const paginatedResponseArbitrary = fc.record({
    results: fc.array(submissionArbitrary, { minLength: 1, maxLength: 10 }),
    count: fc.integer({ min: 1, max: 100 }),
    next: fc.oneof(fc.constant(null), fc.webUrl()),
    previous: fc.oneof(fc.constant(null), fc.webUrl())
  });

  /**
   * CRITICAL TEST: This test MUST FAIL on unfixed code to prove the bug exists
   * 
   * Test that fetchSubmissions correctly parses paginated response `{results: [submissions]}`
   * for all valid submission arrays. When this test fails, it will surface counterexamples
   * that demonstrate the parsing failure bug.
   */
  it('Property 1: Fault Condition - fetchSubmissions correctly parses paginated responses', async () => {
    await fc.assert(
      fc.asyncProperty(paginatedResponseArbitrary, async (paginatedResponse) => {
        // Mock the API client to return paginated response structure
        const mockGet = vi.spyOn(apiClient, 'get').mockResolvedValue({
          data: paginatedResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {}
        });

        // Call fetchSubmissions - this should correctly parse the paginated response
        const result = await fetchSubmissions();

        // CRITICAL ASSERTION: The function should return the submissions array from results
        // If this fails, it proves the bug exists - the parsing logic is not working correctly
        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual(paginatedResponse.results);
        expect(result.length).toBe(paginatedResponse.results.length);

        // Verify each submission in the result matches the original
        result.forEach((submission, index) => {
          expect(submission).toEqual(paginatedResponse.results[index]);
        });

        mockGet.mockRestore();
      }),
      { 
        numRuns: 50,
        verbose: true,
        seed: 42 // Fixed seed for reproducible results
      }
    );
  });

  /**
   * CRITICAL TEST: Test edge case with empty results array
   * 
   * This test verifies that when API returns paginated structure with empty results,
   * the parsing should still work correctly and return an empty array.
   */
  it('Property 1: Fault Condition - fetchSubmissions handles empty paginated responses', async () => {
    const emptyPaginatedResponse = {
      results: [],
      count: 0,
      next: null,
      previous: null
    };

    const mockGet = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: emptyPaginatedResponse,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    });

    const result = await fetchSubmissions();

    // Should return empty array, not undefined or null
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
    expect(result.length).toBe(0);

    mockGet.mockRestore();
  });

  /**
   * CRITICAL TEST: Test that client-side filtering fallback is NOT triggered
   * 
   * This test verifies that when proper parsing works, the system should rely
   * on backend filtering and not trigger client-side filtering fallback.
   * The presence of submissions from multiple users in the API response should
   * not matter if backend filtering is working correctly.
   */
  it('Property 1: Fault Condition - fetchSubmissions processes multi-user data correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(submissionArbitrary, { minLength: 2, maxLength: 10 }),
        async (submissions) => {
          // Ensure we have submissions from different users to test the scenario
          const multiUserSubmissions = submissions.map((sub, index) => ({
            ...sub,
            user: index % 3 + 1, // Distribute across 3 different users
            user_name: `User ${index % 3 + 1}`,
            user_register_number: `USER${(index % 3 + 1).toString().padStart(3, '0')}`
          }));

          const paginatedResponse = {
            results: multiUserSubmissions,
            count: multiUserSubmissions.length,
            next: null,
            previous: null
          };

          const mockGet = vi.spyOn(apiClient, 'get').mockResolvedValue({
            data: paginatedResponse,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
          });

          const result = await fetchSubmissions();

          // CRITICAL: The function should return ALL submissions from the API response
          // Backend filtering should handle user-specific filtering, not the frontend
          expect(Array.isArray(result)).toBe(true);
          expect(result).toEqual(multiUserSubmissions);
          expect(result.length).toBe(multiUserSubmissions.length);

          // Verify that submissions from different users are all present
          // (This proves backend filtering is expected to handle user isolation)
          const userIds = new Set(result.map(sub => sub.user));
          expect(userIds.size).toBeGreaterThan(1);

          mockGet.mockRestore();
        }
      ),
      { 
        numRuns: 30,
        verbose: true,
        seed: 123
      }
    );
  });
});