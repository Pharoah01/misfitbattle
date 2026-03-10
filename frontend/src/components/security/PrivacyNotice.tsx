/**
 * Privacy Notice Component
 * Displays privacy information about IP logging and security monitoring
 */

import React from 'react';

interface PrivacyNoticeProps {
  className?: string;
  compact?: boolean;
}

export const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ 
  className = '', 
  compact = false 
}) => {
  if (compact) {
    return (
      <div className={`text-xs text-text-secondary ${className}`}>
        <p>
          We log IP addresses for security and contest integrity purposes.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-dark-surface/50 border border-purple-primary/20 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-text-primary mb-2 font-rajdhani">
        Privacy & Security Notice
      </h3>
      <div className="text-xs text-text-secondary space-y-2">
        <p>
          We log IP addresses for security and contest integrity purposes. 
          This helps us detect suspicious activities and ensure fair competition.
        </p>
        <p>
          Your session is secured with single active session enforcement. 
          Logging in from another device will invalidate previous sessions.
        </p>
        <p>
          For your security, sessions automatically expire after 30 minutes of inactivity.
        </p>
      </div>
    </div>
  );
};