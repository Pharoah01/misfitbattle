/**
 * Profile Page
 * User profile and submission history
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

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Navbar */}
      <nav className="bg-dark-surface border-b border-dark-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 
              className="text-2xl font-bold text-text-primary cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              Misfits-Battle
            </h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-dark-bg hover:bg-dark-border text-text-primary border border-dark-border rounded transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Card */}
          <div className="bg-dark-surface rounded border border-dark-border p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-primary">Profile</h2>
              <button
                onClick={() => navigate('/edit-profile')}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded transition-colors"
              >
                Edit Profile
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-text-secondary block mb-1">Register Number</label>
                  <p className="text-lg text-text-primary font-medium">{user?.register_number}</p>
                </div>
                
                <div>
                  <label className="text-sm text-text-secondary block mb-1">Name</label>
                  <p className="text-lg text-text-primary font-medium">{user?.name}</p>
                </div>
                
                <div>
                  <label className="text-sm text-text-secondary block mb-1">Email</label>
                  <p className="text-lg text-text-primary font-medium">{user?.email || 'Not set'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-text-secondary block mb-1">College/Institution</label>
                  <p className="text-lg text-text-primary font-medium">{user?.college_name || 'Not set'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-text-secondary block mb-1">Role</label>
                  <p className="text-lg text-text-primary font-medium">
                    {user?.is_admin ? 'Administrator' : 'Participant'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm text-text-secondary block mb-1">Member Since</label>
                  <p className="text-lg text-text-primary font-medium">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submission History */}
          <div className="bg-dark-surface rounded border border-dark-border p-8 mb-6">
            <h3 className="text-xl font-bold text-text-primary mb-4">Submission History</h3>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-text-secondary">Loading submissions...</p>
              </div>
            ) : submissions && submissions.length > 0 ? (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="bg-dark-bg rounded p-4 border border-dark-border hover:border-primary transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-text-primary font-medium">{submission.challenge_title}</h4>
                      <span className="text-sm text-text-secondary">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                      <span>Code Length: {submission.code_length} chars</span>
                      <span>•</span>
                      <span>{new Date(submission.submitted_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-text-secondary mb-4">No submissions yet</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded transition-colors"
                >
                  Start a Challenge
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleLogout}
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
