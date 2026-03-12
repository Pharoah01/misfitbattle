/**
 * API Test Component - Debug Tool
 * Tests API connectivity and authentication
 */

import React, { useState } from 'react';
import { getAccessToken } from '@/api/client';
import apiClient from '@/api/client';

export const ApiTest: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, result: any) => {
    setResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }]);
  };

  const testApiConnection = async () => {
    setLoading(true);
    setResults([]);

    try {
      // Test 1: Check localStorage contents
      const allLocalStorage = { ...localStorage };
      addResult('LocalStorage Contents', allLocalStorage);

      // Test 2: Check token storage
      const token = getAccessToken();
      addResult('Token Storage', { hasToken: !!token, token: token ? `${token.substring(0, 10)}...` : null });

      // Test 3: Test API base URL
      addResult('API Base URL', { baseURL: apiClient.defaults.baseURL });

      // Test 4: Test simple API call (no auth required)
      try {
        const response = await apiClient.get('/api/challenges/');
        addResult('Challenges API (No Auth)', { 
          status: response.status, 
          statusText: response.statusText,
          dataLength: Array.isArray(response.data) ? response.data.length : 'Not array'
        });
      } catch (error: any) {
        addResult('Challenges API (No Auth)', { 
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }

      // Test 5: Test authenticated API call
      if (token) {
        try {
          const response = await apiClient.get('/api/auth/me/');
          addResult('Auth Me API', { 
            status: response.status, 
            statusText: response.statusText,
            user: response.data
          });
        } catch (error: any) {
          addResult('Auth Me API', { 
            error: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
        }
      } else {
        addResult('Auth Me API', { skipped: 'No token available' });
      }

      // Test 6: Test direct fetch to API
      try {
        const response = await fetch(`${apiClient.defaults.baseURL}/api/challenges/`);
        const data = await response.json();
        addResult('Direct Fetch Test', { 
          status: response.status, 
          statusText: response.statusText,
          dataLength: Array.isArray(data) ? data.length : 'Not array'
        });
      } catch (error: any) {
        addResult('Direct Fetch Test', { error: error.message });
      }

    } catch (error: any) {
      addResult('General Error', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="p-4 bg-dark-surface border border-purple-primary/20 rounded-lg">
      <h3 className="text-lg font-bold text-text-primary mb-4 font-rajdhani">API Connection Test</h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={testApiConnection}
          disabled={loading}
          className="px-4 py-2 bg-purple-primary hover:bg-purple-dark disabled:opacity-50 text-white rounded font-rajdhani"
        >
          {loading ? 'Testing...' : 'Test API Connection'}
        </button>
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-rajdhani"
        >
          Clear Results
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-text-primary font-rajdhani">Test Results:</h4>
          {results.map((result, index) => (
            <div key={index} className="p-3 bg-dark-bg border border-purple-primary/10 rounded">
              <div className="font-semibold text-purple-primary font-rajdhani">{result.test}</div>
              <pre className="text-xs text-text-secondary mt-1 overflow-x-auto">
                {JSON.stringify(result.result, null, 2)}
              </pre>
              <div className="text-xs text-text-secondary mt-1">{result.timestamp}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};