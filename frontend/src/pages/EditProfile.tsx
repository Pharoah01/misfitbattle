/**
 * Edit Profile Page
 * All profile data is fetched from HTP — read-only display
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-surface/50 backdrop-blur-sm border-b border-purple-primary/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/profile')}
              className="text-text-secondary hover:text-purple-primary transition-colors flex items-center gap-2 font-rajdhani font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="h-6 w-px bg-purple-primary/30"></div>
            <h1 className="text-2xl font-bold text-text-primary font-orbitron">
              <span className="bg-gradient-to-r from-purple-primary to-purple-tertiary bg-clip-text text-transparent">
                Profile
              </span>
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-dark-surface rounded-lg border border-purple-primary/20 p-8 space-y-6">

            {/* Info Banner */}
            <div className="bg-dark-bg/50 border border-purple-primary/10 rounded-lg p-4">
              <p className="text-text-secondary text-sm font-rajdhani text-center">
                All profile details are synced from your Hack The Planet account.
              </p>
            </div>

            {/* HTPID */}
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 font-rajdhani">
                HTPID
              </label>
              <input
                type="text"
                value={user?.htp_id || ''}
                disabled
                className="w-full px-4 py-3 bg-dark-bg/50 border border-purple-primary/10 rounded-lg text-text-secondary cursor-not-allowed font-mono"
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 font-rajdhani">
                Full Name
              </label>
              <input
                type="text"
                value={user?.name || ''}
                disabled
                className="w-full px-4 py-3 bg-dark-bg/50 border border-purple-primary/10 rounded-lg text-text-secondary cursor-not-allowed font-rajdhani"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 font-rajdhani">
                Email
              </label>
              <input
                type="text"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-dark-bg/50 border border-purple-primary/10 rounded-lg text-text-secondary cursor-not-allowed font-mono"
              />
            </div>

            {/* College */}
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 font-rajdhani">
                College/Institution
              </label>
              <input
                type="text"
                value={user?.college_name || ''}
                disabled
                className="w-full px-4 py-3 bg-dark-bg/50 border border-purple-primary/10 rounded-lg text-text-secondary cursor-not-allowed font-rajdhani"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 font-rajdhani">
                Department
              </label>
              <input
                type="text"
                value={user?.department || ''}
                disabled
                className="w-full px-4 py-3 bg-dark-bg/50 border border-purple-primary/10 rounded-lg text-text-secondary cursor-not-allowed font-rajdhani"
              />
            </div>

            {/* Back Button */}
            <button
              onClick={() => navigate('/profile')}
              className="w-full px-6 py-3 bg-dark-bg hover:bg-dark-surface text-text-primary border border-purple-primary/30 hover:border-purple-primary font-bold rounded-lg transition-all font-rajdhani"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
