/**
 * Submission Success Modal - Shows after successful challenge submission
 */

import React, { useEffect, useState } from 'react';
import type { Challenge } from '@/types';

interface SubmissionSuccessProps {
  isOpen: boolean;
  challenge: Challenge;
  onClose: () => void;
  redirectCountdown?: number;
}

export const SubmissionSuccess: React.FC<SubmissionSuccessProps> = ({ 
  isOpen, 
  challenge, 
  onClose,
  redirectCountdown = 5
}) => {
  const [countdown, setCountdown] = useState(redirectCountdown);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(redirectCountdown);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, redirectCountdown, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-surface rounded-lg border border-purple-primary/30 max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-purple-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary font-orbitron">
                Submission Successful!
              </h2>
              <p className="text-text-secondary font-rajdhani">Challenge completed</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Challenge Info */}
          <div className="bg-dark-bg rounded-lg p-4 border border-purple-primary/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary font-rajdhani">Challenge:</span>
              <span className="text-text-primary font-semibold font-rajdhani">{challenge.title}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary font-rajdhani">Points Earned:</span>
              <span className="text-orange-500 font-bold font-rajdhani">{challenge.points} pts</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary font-rajdhani">Difficulty:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-bold font-rajdhani border ${
                challenge.difficulty === 'easy' 
                  ? 'bg-green-500/10 text-green-500 border-green-500/30'
                  : challenge.difficulty === 'medium'
                  ? 'bg-orange-500/10 text-orange-500 border-orange-500/30'
                  : 'bg-red-500/10 text-red-500 border-red-500/30'
              }`}>
                {challenge.difficulty.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center">
            <p className="text-text-primary font-rajdhani text-lg mb-2">
              Your solution has been submitted successfully!
            </p>
            <p className="text-text-secondary font-rajdhani text-sm">
              This was your only allowed submission for this challenge.
            </p>
          </div>

          {/* Redirect Info */}
          <div className="bg-purple-primary/10 rounded-lg p-4 border border-purple-primary/20 text-center">
            <p className="text-text-primary font-rajdhani mb-2">
              Redirecting to dashboard in
            </p>
            <div className="text-3xl font-bold text-purple-primary font-orbitron mb-2">
              {countdown}
            </div>
            <p className="text-text-secondary font-rajdhani text-sm">
              Ready for your next challenge?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-dark hover:to-purple-primary text-white font-bold rounded-lg transition-all font-rajdhani shadow-lg shadow-purple-primary/30"
            >
              Go to Dashboard Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};