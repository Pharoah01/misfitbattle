import { afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

beforeAll(() => {
  const storage: Record<string, string> = {};
  
  const localStorageMock = {
    getItem: (key: string): string | null => {
      return storage[key] || null;
    },
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((key) => {
        delete storage[key];
      });
    },
    get length() {
      return Object.keys(storage).length;
    },
    key: (index: number): string | null => {
      const keys = Object.keys(storage);
      return keys[index] || null;
    },
  };

  (globalThis as any).localStorage = localStorageMock as Storage;
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});
