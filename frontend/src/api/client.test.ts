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
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should add Authorization header when token exists in localStorage', async () => {
    const testToken = 'test-access-token-123';
    localStorage.setItem('access_token', testToken);

    const mockAdapter = vi.fn((config) => {
      expect(config.headers.Authorization).toBe(`Bearer ${testToken}`);
      return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
    });

    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = mockAdapter;

    try {
      await apiClient.get('/test');
      expect(mockAdapter).toHaveBeenCalled();
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  it('should not add Authorization header when token does not exist', async () => {
    localStorage.removeItem('access_token');

    const mockAdapter = vi.fn((config) => {
      expect(config.headers.Authorization).toBeUndefined();
      return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
    });

    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = mockAdapter;

    try {
      await apiClient.get('/test');
      expect(mockAdapter).toHaveBeenCalled();
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  it('should handle missing token gracefully without throwing errors', async () => {
    localStorage.removeItem('access_token');

    const mockAdapter = vi.fn((config) => {
      return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
    });

    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = mockAdapter;

    try {
      await expect(apiClient.get('/test')).resolves.toBeDefined();
      expect(mockAdapter).toHaveBeenCalled();
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  it('should update Authorization header when token changes', async () => {
    const firstToken = 'first-token';
    localStorage.setItem('access_token', firstToken);

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

    const secondToken = 'second-token';
    localStorage.setItem('access_token', secondToken);

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
    localStorage.clear();
    vi.clearAllMocks();
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  afterEach(() => {
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
        return Promise.reject({
          response: { status: 401 },
          config,
        });
      } else {
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
      
      expect(axiosPostSpy).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/auth/token/refresh/`,
        { refresh: refreshToken }
      );
      
      expect(localStorage.getItem('access_token')).toBe(newAccessToken);
      
      expect(response.data).toEqual({ success: true });
      expect(mockAdapter).toHaveBeenCalledTimes(2);
    } finally {
      apiClient.defaults.adapter = originalAdapter;
      axiosPostSpy.mockRestore();
    }
  });

  it('should redirect to sign in when refresh token is missing', async () => {
    localStorage.setItem('access_token', 'expired-token');

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
      expect(localStorage.getItem('access_token')).toBeNull();
      
      expect(window.location.href).toBe('/login');
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  it('should redirect to sign in when token refresh fails', async () => {
    const refreshToken = 'invalid-refresh-token';
    localStorage.setItem('access_token', 'expired-token');
    localStorage.setItem('refresh_token', refreshToken);

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
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      
      expect(window.location.href).toBe('/login');
    } finally {
      apiClient.defaults.adapter = originalAdapter;
      axiosPostSpy.mockRestore();
    }
  });

  it('should prevent infinite retry loops with _retry flag', async () => {
    const refreshToken = 'valid-refresh-token';
    localStorage.setItem('access_token', 'expired-token');
    localStorage.setItem('refresh_token', refreshToken);

    const axiosPostSpy = vi.spyOn(axios, 'post').mockRejectedValue({
      response: { status: 401 },
    });

    let callCount = 0;
    const mockAdapter = vi.fn((config) => {
      callCount++;
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
      expect(callCount).toBe(1);
      
      expect(window.location.href).toBe('/login');
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
      expect(axiosPostSpy).not.toHaveBeenCalled();
      
      expect(error.response.status).toBe(404);
      
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
      });
    });

    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = mockAdapter;

    try {
      await apiClient.get('/test');
    } catch (error: any) {
      expect(axiosPostSpy).not.toHaveBeenCalled();
      
      expect(error.message).toBe('Network Error');
      
      expect(localStorage.getItem('access_token')).toBe('valid-token');
      expect(localStorage.getItem('refresh_token')).toBe('valid-refresh-token');
    } finally {
      apiClient.defaults.adapter = originalAdapter;
      axiosPostSpy.mockRestore();
    }
  });
});
