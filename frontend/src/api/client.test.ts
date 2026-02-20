/**
 * Unit tests for Axios API client configuration
 * 
 * Tests verify:
 * - Base URL is set from environment variable
 * - withCredentials is enabled for CORS
 * - Content-Type header is set to application/json
 * - Request interceptor adds Authorization header with Bearer token
 * - Response interceptor handles 401 errors with token refresh
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.5, 2.7, 11.2, 16.1, 16.6
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import apiClient from './client';
import { API_BASE_URL } from '../config/constants';

describe('API Client Configuration', () => {
  it('should have correct baseURL from environment variable', () => {
    expect(apiClient.defaults.baseURL).toBe(API_BASE_URL);
  });

  it('should have withCredentials enabled for CORS', () => {
    expect(apiClient.defaults.withCredentials).toBe(true);
  });

  it('should have Content-Type header set to application/json', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should have all required configuration properties', () => {
    expect(apiClient.defaults).toBeDefined();
    expect(apiClient.defaults.baseURL).toBeTruthy();
    expect(typeof apiClient.defaults.baseURL).toBe('string');
    expect(apiClient.defaults.withCredentials).toBe(true);
  });

  it('should be a valid axios instance with request methods', () => {
    expect(typeof apiClient.get).toBe('function');
    expect(typeof apiClient.post).toBe('function');
    expect(typeof apiClient.put).toBe('function');
    expect(typeof apiClient.delete).toBe('function');
  });
});

describe('Request Interceptor for Authentication', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  it('should add Authorization header when token exists in localStorage', async () => {
    // Set up token in localStorage
    const testToken = 'test-access-token-123';
    localStorage.setItem('access_token', testToken);

    // Create a mock adapter to intercept the request
    const mockAdapter = vi.fn((config) => {
      expect(config.headers.Authorization).toBe(`Bearer ${testToken}`);
      return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
    });

    // Temporarily replace the adapter
    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = mockAdapter;

    try {
      await apiClient.get('/test');
      expect(mockAdapter).toHaveBeenCalled();
    } finally {
      // Restore original adapter
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  it('should not add Authorization header when token does not exist', async () => {
    // Ensure no token in localStorage
    localStorage.removeItem('access_token');

    // Create a mock adapter to intercept the request
    const mockAdapter = vi.fn((config) => {
      expect(config.headers.Authorization).toBeUndefined();
      return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
    });

    // Temporarily replace the adapter
    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = mockAdapter;

    try {
      await apiClient.get('/test');
      expect(mockAdapter).toHaveBeenCalled();
    } finally {
      // Restore original adapter
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  it('should handle missing token gracefully without throwing errors', async () => {
    // Ensure no token in localStorage
    localStorage.removeItem('access_token');

    // Create a mock adapter
    const mockAdapter = vi.fn((config) => {
      return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
    });

    // Temporarily replace the adapter
    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = mockAdapter;

    try {
      // Should not throw an error
      await expect(apiClient.get('/test')).resolves.toBeDefined();
      expect(mockAdapter).toHaveBeenCalled();
    } finally {
      // Restore original adapter
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  it('should update Authorization header when token changes', async () => {
    // Set initial token
    const firstToken = 'first-token';
    localStorage.setItem('access_token', firstToken);

    // Create a mock adapter for first request
    const mockAdapter1 = vi.fn((config) => {
      expect(config.headers.Authorization).toBe(`Bearer ${firstToken}`);
      return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
    });

    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = mockAdapter1;

    try {
      await apiClient.get('/test');
      expect(mockAdapter1).toHaveBeenCalled();
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }

    // Change token
    const secondToken = 'second-token';
    localStorage.setItem('access_token', secondToken);

    // Create a mock adapter for second request
    const mockAdapter2 = vi.fn((config) => {
      expect(config.headers.Authorization).toBe(`Bearer ${secondToken}`);
      return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
    });

    apiClient.defaults.adapter = mockAdapter2;

    try {
      await apiClient.get('/test');
      expect(mockAdapter2).toHaveBeenCalled();
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });
});

describe('Response Interceptor for Token Refresh', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear any mocks
    vi.clearAllMocks();
    // Reset window.location
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should pass through successful responses without modification', async () => {
    const mockData = { message: 'success' };
    const mockAdapter = vi.fn((config) => {
      return Promise.resolve({ 
        data: mockData, 
        status: 200, 
        statusText: 'OK', 
        headers: {}, 
        config 
      });
    });

    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = mockAdapter;

    try {
      const response = await apiClient.get('/test');
      expect(response.data).toEqual(mockData);
      expect(response.status).toBe(200);
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  it('should attempt token refresh on 401 response', async () => {
    const refreshToken = 'valid-refresh-token';
    const newAccessToken = 'new-access-token';
    localStorage.setItem('access_token', 'expired-token');
    localStorage.setItem('refresh_token', refreshToken);

    // Mock axios.post for refresh token request
    const axiosPostSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: { access: newAccessToken },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    let callCount = 0;
    const mockAdapter = vi.fn((config) => {
      callCount++;
      if (callCount === 1) {
        // First call returns 401
        return Promise.reject({
          response: { status: 401 },
          config,
        });
      } else {
        // Second call (retry) succeeds
        expect(config.headers.Authorization).toBe(`Bearer ${newAccessToken}`);
        return Promise.resolve({ 
          data: { success: true }, 
          status: 200, 
          statusText: 'OK', 
          headers: {}, 
          config 
        });
      }
    });

    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = mockAdapter;

    try {
      const response = await apiClient.get('/test');
      
      // Verify refresh token was called
      expect(axiosPostSpy).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/auth/token/refresh/`,
        { refresh: refreshToken }
      );
      
      // Verify new token was stored
      expect(localStorage.getItem('access_token')).toBe(newAccessToken);
      
      // Verify original request was retried and succeeded
      expect(response.data).toEqual({ success: true });
      expect(mockAdapter).toHaveBeenCalledTimes(2);
    } finally {
      apiClient.defaults.adapter = originalAdapter;
      axiosPostSpy.mockRestore();
    }
  });

  it('should redirect to sign in when refresh token is missing', async () => {
    localStorage.setItem('access_token', 'expired-token');
    // No refresh token in localStorage

    const mockAdapter = vi.fn((config) => {
      return Promise.reject({
        response: { status: 401 },
        config,
      });
    });

    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = mockAdapter;

    try {
      await apiClient.get('/test');
    } catch (error) {
      // Verify tokens were cleared
      expect(localStorage.getItem('access_token')).toBeNull();
      
      // Verify redirect to sign in
      expect(window.location.href).toBe('/signin');
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  it('should redirect to sign in when token refresh fails', async () => {
    const refreshToken = 'invalid-refresh-token';
    localStorage.setItem('access_token', 'expired-token');
    localStorage.setItem('refresh_token', refreshToken);

    // Mock axios.post to reject (refresh fails)
    const axiosPostSpy = vi.spyOn(axios, 'post').mockRejectedValueOnce({
      response: { status: 401 },
    });

    const mockAdapter = vi.fn((config) => {
      return Promise.reject({
        response: { status: 401 },
        config,
      });
    });

    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = mockAdapter;

    try {
      await apiClient.get('/test');
    } catch (error) {
      // Verify tokens were cleared
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      
      // Verify redirect to sign in
      expect(window.location.href).toBe('/signin');
    } finally {
      apiClient.defaults.adapter = originalAdapter;
      axiosPostSpy.mockRestore();
    }
  });

  it('should prevent infinite retry loops with _retry flag', async () => {
    const refreshToken = 'valid-refresh-token';
    localStorage.setItem('access_token', 'expired-token');
    localStorage.setItem('refresh_token', refreshToken);

    // Mock axios.post to always return 401 (simulating persistent auth failure)
    const axiosPostSpy = vi.spyOn(axios, 'post').mockRejectedValue({
      response: { status: 401 },
    });

    let callCount = 0;
    const mockAdapter = vi.fn((config) => {
      callCount++;
      // Always return 401
      return Promise.reject({
        response: { status: 401 },
        config,
      });
    });

    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = mockAdapter;

    try {
      await apiClient.get('/test');
    } catch (error) {
      // Should only attempt once (original request)
      // The retry should fail during refresh and not retry again
      expect(callCount).toBe(1);
      
      // Verify redirect happened
      expect(window.location.href).toBe('/signin');
    } finally {
      apiClient.defaults.adapter = originalAdapter;
      axiosPostSpy.mockRestore();
    }
  });

  it('should pass through non-401 errors without attempting refresh', async () => {
    localStorage.setItem('access_token', 'valid-token');
    localStorage.setItem('refresh_token', 'valid-refresh-token');

    const axiosPostSpy = vi.spyOn(axios, 'post');

    const mockAdapter = vi.fn((config) => {
      return Promise.reject({
        response: { status: 404, data: { message: 'Not found' } },
        config,
      });
    });

    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = mockAdapter;

    try {
      await apiClient.get('/test');
    } catch (error: any) {
      // Verify refresh was NOT attempted
      expect(axiosPostSpy).not.toHaveBeenCalled();
      
      // Verify error was passed through
      expect(error.response.status).toBe(404);
      
      // Verify tokens were NOT cleared
      expect(localStorage.getItem('access_token')).toBe('valid-token');
      expect(localStorage.getItem('refresh_token')).toBe('valid-refresh-token');
    } finally {
      apiClient.defaults.adapter = originalAdapter;
      axiosPostSpy.mockRestore();
    }
  });

  it('should handle network errors without attempting refresh', async () => {
    localStorage.setItem('access_token', 'valid-token');
    localStorage.setItem('refresh_token', 'valid-refresh-token');

    const axiosPostSpy = vi.spyOn(axios, 'post');

    const mockAdapter = vi.fn((config) => {
      return Promise.reject({
        message: 'Network Error',
        config,
        // No response object for network errors
      });
    });

    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = mockAdapter;

    try {
      await apiClient.get('/test');
    } catch (error: any) {
      // Verify refresh was NOT attempted
      expect(axiosPostSpy).not.toHaveBeenCalled();
      
      // Verify error was passed through
      expect(error.message).toBe('Network Error');
      
      // Verify tokens were NOT cleared
      expect(localStorage.getItem('access_token')).toBe('valid-token');
      expect(localStorage.getItem('refresh_token')).toBe('valid-refresh-token');
    } finally {
      apiClient.defaults.adapter = originalAdapter;
      axiosPostSpy.mockRestore();
    }
  });
});
