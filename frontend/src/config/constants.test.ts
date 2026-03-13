/**
 * Basic verification tests for configuration constants
 * These tests ensure the configuration is properly set up
 */

import { describe, it, expect } from 'vitest';
import {
  API_BASE_URL,
  TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  MAX_CODE_LENGTH,
  VALIDATION_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from './constants';

describe('Configuration Constants', () => {
  it('should have a valid API_BASE_URL', () => {
    expect(API_BASE_URL).toBeDefined();
    expect(typeof API_BASE_URL).toBe('string');
    expect(API_BASE_URL.length).toBeGreaterThan(0);
    expect(API_BASE_URL).toMatch(/^https?:\/\/.+/);
  });

  it('should have token storage keys defined', () => {
    expect(TOKEN_STORAGE_KEY).toBe('access_token');
    expect(REFRESH_TOKEN_STORAGE_KEY).toBe('refresh_token');
  });

  it('should have valid code length constraints', () => {
    expect(MAX_CODE_LENGTH).toBe(10000);
    expect(MAX_CODE_LENGTH).toBeGreaterThan(0);
  });

  it('should have validation patterns defined', () => {
    expect(VALIDATION_PATTERNS.REGISTER_NUMBER).toBeInstanceOf(RegExp);
    expect(VALIDATION_PATTERNS.EMAIL).toBeInstanceOf(RegExp);
    expect(VALIDATION_PATTERNS.PASSWORD).toBeInstanceOf(RegExp);
  });

  it('should validate register_number pattern correctly', () => {
    const pattern = VALIDATION_PATTERNS.REGISTER_NUMBER;
    
    expect(pattern.test('abc123')).toBe(true);
    expect(pattern.test('user123')).toBe(true);
    expect(pattern.test('ABC')).toBe(true);
    
    expect(pattern.test('ab')).toBe(false); // Too short
    expect(pattern.test('a'.repeat(21))).toBe(false); // Too long
    expect(pattern.test('user@123')).toBe(false); // Special characters
    expect(pattern.test('user 123')).toBe(false); // Space
  });

  it('should validate email pattern correctly', () => {
    const pattern = VALIDATION_PATTERNS.EMAIL;
    
    expect(pattern.test('user@example.com')).toBe(true);
    expect(pattern.test('test.user@domain.co.uk')).toBe(true);
    
    expect(pattern.test('invalid')).toBe(false);
    expect(pattern.test('invalid@')).toBe(false);
    expect(pattern.test('@domain.com')).toBe(false);
  });

  it('should validate password pattern correctly', () => {
    const pattern = VALIDATION_PATTERNS.PASSWORD;
    
    expect(pattern.test('password123')).toBe(true);
    expect(pattern.test('Pass1234')).toBe(true);
    expect(pattern.test('MyP@ssw0rd')).toBe(true);
    
    expect(pattern.test('short1')).toBe(false); // Too short
    expect(pattern.test('password')).toBe(false); // No number
    expect(pattern.test('12345678')).toBe(false); // No letter
  });

  it('should have error messages defined', () => {
    expect(ERROR_MESSAGES.NETWORK_ERROR).toBeDefined();
    expect(ERROR_MESSAGES.UNAUTHORIZED).toBeDefined();
    expect(ERROR_MESSAGES.FORBIDDEN).toBeDefined();
    expect(ERROR_MESSAGES.NOT_FOUND).toBeDefined();
    expect(ERROR_MESSAGES.SERVER_ERROR).toBeDefined();
    expect(ERROR_MESSAGES.RATE_LIMIT).toBeDefined();
  });

  it('should have success messages defined', () => {
    expect(SUCCESS_MESSAGES.SIGN_UP).toBeDefined();
    expect(SUCCESS_MESSAGES.SIGN_IN).toBeDefined();
    expect(SUCCESS_MESSAGES.SUBMISSION).toBeDefined();
    expect(SUCCESS_MESSAGES.CHALLENGE_CREATED).toBeDefined();
  });
});
