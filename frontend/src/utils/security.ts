/**
 * Security Utilities
 * Production security enhancements
 */

/**
 * Disable console logging in production
 * Prevents users from seeing debug information
 */
export const disableConsoleInProduction = (): void => {
  if (import.meta.env.PROD) {
    // Disable all console methods in production
    console.log = () => {};
    console.warn = () => {};
    console.info = () => {};
    console.debug = () => {};
    
    // Keep console.error for critical issues (but limit information)
    const originalError = console.error;
    console.error = () => {
      // Only log generic error message in production
      originalError('An error occurred. Please contact support if the issue persists.');
    };
  }
};

/**
 * Obfuscate sensitive data in logs
 * @param data - Data to obfuscate
 * @returns Obfuscated data safe for logging
 */
export const obfuscateForLogging = (data: any): any => {
  if (import.meta.env.PROD) {
    // In production, don't log sensitive data
    return '[REDACTED]';
  }
  
  // In development, show actual data
  return data;
};

/**
 * Generate request fingerprint for security
 * @returns Fingerprint string
 */
export const generateRequestFingerprint = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  
  // Simple fingerprint - can be enhanced with more sophisticated methods
  return btoa(`${timestamp}-${random}`).substring(0, 16);
};

/**
 * Validate request integrity
 * @param fingerprint - Request fingerprint
 * @returns True if request appears valid
 */
export const validateRequestIntegrity = (fingerprint: string): boolean => {
  // Basic validation - can be enhanced
  return Boolean(fingerprint && fingerprint.length === 16);
};

/**
 * Initialize security measures
 */
export const initializeSecurity = (): void => {
  disableConsoleInProduction();
  
  // Disable right-click in production (optional)
  if (import.meta.env.PROD) {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
    
    // Disable F12, Ctrl+Shift+I, etc. (optional - can be bypassed)
    document.addEventListener('keydown', (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        return false;
      }
    });
  }
};