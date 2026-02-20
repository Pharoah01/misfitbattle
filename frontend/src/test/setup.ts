import { afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock localStorage for tests
beforeAll(() => {
  const localStorageMock: Record<string, string> & {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
    clear: () => void;
  } = {
    getItem: (key: string): string | null => {
      return localStorageMock[key] || null;
    },
    setItem: (key: string, value: string) => {
      localStorageMock[key] = value;
    },
    removeItem: (key: string) => {
      delete localStorageMock[key];
    },
    clear: () => {
      Object.keys(localStorageMock).forEach((key) => {
        if (key !== 'getItem' && key !== 'setItem' && key !== 'removeItem' && key !== 'clear') {
          delete localStorageMock[key];
        }
      });
    },
  };

  (globalThis as any).localStorage = localStorageMock as Storage;
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  localStorage.clear();
});
