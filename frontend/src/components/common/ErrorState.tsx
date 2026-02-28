/**
 * Error State Component
 * Shows friendly error message with retry button
 */

import React from 'react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  message = 'Something went wrong. Please try again.',
  onRetry,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="mb-4">
          <svg 
            className="w-16 h-16 mx-auto text-primary" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        
        {/* Error Message */}
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Oops! Something went wrong
        </h3>
        <p className="text-text-secondary mb-6">
          {message}
        </p>
        
        {/* Retry Button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded transition-colors duration-200"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};
