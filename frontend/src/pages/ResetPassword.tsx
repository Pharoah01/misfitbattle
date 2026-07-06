/**
 * Reset Password Page
 * User enters HTPID + new password. Backend verifies via HTP API.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from '@/utils';
import { API_BASE_URL } from '@/config/constants';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [htpId, setHtpId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!htpId.trim()) { toast.error('HTPID is required'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      // Use raw axios to avoid auth interceptor issues
      await axios.post(`${API_BASE_URL}/api/auth/reset-password/`, {
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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-bg border border-purple-primary/30 rounded-lg text-text-primary font-rajdhani focus:outline-none focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/20 pr-12"
                  placeholder="At least 8 characters"
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2 font-rajdhani">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
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
