/**
 * Profile Page - Purple Cyber-Tech Theme
 * User profile and submission history with modern design
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useSubmissions } from '@/hooks';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: submissions, isLoading } = useSubmissions();


  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const submissionsArray = Array.isArray(submissions) ? submissions : [];
  const totalSubmissions = submissionsArray.length;
  const completedChallenges = new Set(submissionsArray.map(s => s.challenge)).size;

  const needsProfileCompletion = user && !user.profile_completed;

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-surface/50 backdrop-blur-sm border-b border-purple-primary/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 
              className="text-2xl font-bold text-text-primary font-orbitron tracking-wider cursor-pointer group transition-colors duration-300 hover:text-purple-primary"
              onClick={() => user?.profile_completed ? navigate('/dashboard') : undefined}
            >
              <span className="text-purple-primary">MISFITS</span>-BATTLE
            </h1>
            {user?.profile_completed ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-dark-bg hover:bg-dark-surface text-text-primary border border-purple-primary/30 hover:border-purple-primary rounded transition-all font-rajdhani font-semibold"
              >
                Back to Dashboard
              </button>
            ) : (
              <div className="px-4 py-2 bg-orange-500/10 text-orange-500 border border-orange-500/30 rounded font-rajdhani font-semibold">
                Complete Profile Required
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Completion Banner */}
          {needsProfileCompletion && (
            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-text-primary mb-2 font-orbitron">
                    Complete Your Profile
                  </h3>
                  <p className="text-text-secondary font-rajdhani mb-4">
                    Welcome to Misfits Battle! Please complete your profile to access challenges and start competing.
                  </p>
                  <button
                    onClick={() => navigate('/edit-profile')}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-lg transition-all font-rajdhani shadow-lg shadow-orange-500/30"
                  >
                    Complete Profile Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Header with Stats */}
          <div className="bg-gradient-to-br from-purple-primary/10 to-purple-tertiary/10 rounded-lg border border-purple-primary/30 p-8 mb-6 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-tertiary/5 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-4xl font-bold text-text-primary mb-2 font-orbitron">
                    <span className="bg-gradient-to-r from-purple-primary to-purple-tertiary bg-clip-text text-transparent">
                      {user?.name}
                    </span>
                  </h2>
                  <p className="text-text-secondary font-rajdhani text-lg">{user?.htp_id || user?.register_number}</p>
                </div>
                <button
                  onClick={() => navigate('/edit-profile')}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-dark hover:to-purple-primary text-white font-bold rounded-lg transition-all font-rajdhani shadow-lg shadow-purple-primary/30"
                >
                  Edit Profile
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-dark-surface/50 backdrop-blur-sm rounded-lg p-4 border border-purple-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-primary to-purple-secondary rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary font-orbitron">{totalSubmissions}</p>
                      <p className="text-sm text-text-secondary font-rajdhani">Total Submissions</p>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-surface/50 backdrop-blur-sm rounded-lg p-4 border border-purple-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary font-orbitron">{completedChallenges}</p>
                      <p className="text-sm text-text-secondary font-rajdhani">Challenges Attempted</p>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-surface/50 backdrop-blur-sm rounded-lg p-4 border border-purple-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-tertiary to-purple-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text-primary font-rajdhani truncate">{user?.college_name || 'Not set'}</p>
                      <p className="text-xs text-text-secondary font-rajdhani">Institution</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="bg-dark-surface rounded-lg border border-purple-primary/20 p-6 mb-6">
            <h3 className="text-xl font-bold text-text-primary mb-6 font-orbitron flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-purple-primary to-purple-tertiary rounded"></span>
              Profile Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-dark-bg rounded-lg p-4 border border-purple-primary/10">
                <label className="text-xs text-text-secondary uppercase tracking-wider block mb-2 font-rajdhani font-semibold">HTPID</label>
                <p className="text-lg text-text-primary font-mono">{user?.htp_id || user?.register_number}</p>
              </div>
              
              <div className="bg-dark-bg rounded-lg p-4 border border-purple-primary/10">
                <label className="text-xs text-text-secondary uppercase tracking-wider block mb-2 font-rajdhani font-semibold">Full Name</label>
                <p className="text-lg text-text-primary font-rajdhani">{user?.name}</p>
              </div>
              
              <div className="bg-dark-bg rounded-lg p-4 border border-purple-primary/10">
                <label className="text-xs text-text-secondary uppercase tracking-wider block mb-2 font-rajdhani font-semibold">Email Address</label>
                <p className="text-lg text-text-primary font-mono">{user?.email || 'Not set'}</p>
              </div>
              
              <div className="bg-dark-bg rounded-lg p-4 border border-purple-primary/10">
                <label className="text-xs text-text-secondary uppercase tracking-wider block mb-2 font-rajdhani font-semibold">College/Institution</label>
                <p className="text-lg text-text-primary font-rajdhani">{user?.college_name || 'Not set'}</p>
              </div>
            </div>
          </div>

          {/* Submission History */}
          <div className="bg-dark-surface rounded-lg border border-purple-primary/20 p-6 mb-6">
            <h3 className="text-xl font-bold text-text-primary mb-6 font-orbitron flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-purple-primary to-purple-tertiary rounded"></span>
              Submission History
            </h3>
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-primary mx-auto mb-4"></div>
                <p className="text-text-secondary font-rajdhani">Loading submissions...</p>
              </div>
            ) : submissionsArray.length > 0 ? (
              <div className="space-y-3">
                {submissionsArray.map((submission) => (
                  <div
                    key={submission.id}
                    className="bg-dark-bg rounded-lg p-4 border border-purple-primary/10 hover:border-purple-primary/30 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-text-primary font-semibold font-rajdhani group-hover:text-purple-primary transition-colors">
                        {submission.challenge_title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-secondary font-mono">
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="px-3 py-1 bg-purple-primary/10 text-purple-primary rounded-full font-mono text-xs border border-purple-primary/20">
                        {submission.code_length} chars
                      </span>
                      <span className="text-text-secondary font-rajdhani">
                        {new Date(submission.submitted_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-purple-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-text-secondary mb-4 font-rajdhani text-lg">No submissions yet</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-dark hover:to-purple-primary text-white font-bold rounded-lg transition-all font-rajdhani shadow-lg shadow-purple-primary/30"
                >
                  Start a Challenge
                </button>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg transition-all font-rajdhani shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
