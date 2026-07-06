/**
 * Reset Password Page
 * User enters HTPID + new password. Backend verifies via HTP API.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { toast } from '@/utils';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [htpId, setHtpId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!htpId.trim()) { toast.error('HTPID is required'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      await apiClient.post('/api/auth/reset-password/', {
        htp_id: htpId.trim().toUpperCase(),
        new_password: newPassword,
      });
      toast.success('Password reset successful');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2 font-orbitron tracking-wider">
            <span className="text-purple-primary">MISFITS</span>-BATTLE
          </h1>
          <p className="text-text-secondary font-rajdhani text-lg">Reset your password</p>
        </div>

        <div className="bg-dark-surface border border-purple-primary/20 rounded-lg p-8 shadow-xl shadow-purple-primary/10">
          <h2 className="text-2xl font-bold text-text-primary mb-2 font-rajdhani">Reset Password</h2>
          <p className="text-text-secondary text-sm mb-6 font-rajdhani">
            Enter your HTPID to verify your identity.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2 font-rajdhani">HTPID</label>
              <input
                type="text"
                value={htpId}
                onChange={e => setHtpId(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-purple-primary/30 rounded-lg text-text-primary font-rajdhani uppercase focus:outline-none focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/20"
                placeholder="HTP-2026-XXXX"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2 font-rajdhani">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-purple-primary/30 rounded-lg text-text-primary font-rajdhani focus:outline-none focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/20"
                placeholder="At least 8 characters"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2 font-rajdhani">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-purple-primary/30 rounded-lg text-text-primary font-rajdhani focus:outline-none focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/20"
                placeholder="Re-enter password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-dark hover:to-purple-primary disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all font-rajdhani shadow-lg shadow-purple-primary/30"
            >
              {loading ? 'Verifying...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-purple-primary hover:text-purple-secondary text-sm font-rajdhani font-semibold">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
