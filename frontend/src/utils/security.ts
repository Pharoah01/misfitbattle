/**
 * Security Utilities - Production Security Features
 */

export const disableConsoleInProduction = (): void => {
  if (import.meta.env.PROD) {
    console.log = () => {};
    console.warn = () => {};
    console.info = () => {};
    console.debug = () => {};
    
    const originalError = console.error;
    console.error = () => {
      originalError('An error occurred. Please contact support if the issue persists.');
    };
  }
};

export const obfuscateForLogging = (data: any): any => {
  if (import.meta.env.PROD) {
    return '[REDACTED]';
  }
  return data;
};

export const generateRequestFingerprint = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return btoa(`${timestamp}-${random}`).substring(0, 16);
};

export const validateRequestIntegrity = (fingerprint: string): boolean => {
  return Boolean(fingerprint && fingerprint.length === 16);
};

export const initializeSecurity = (): void => {
  disableConsoleInProduction();
  
  if (import.meta.env.PROD) {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
    
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