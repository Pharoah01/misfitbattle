/**
 * Login Page
 * Allows users to authenticate with HTPID and password
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { toast } from '@/utils';
import { PrivacyNotice } from '@/components';
import type { LoginFormData } from '@/types';

export const Login: React.FC = () => {
  const { login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState<LoginFormData>({
    htp_id: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated && !loading) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location]);

  const validate = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.htp_id.trim()) {
      newErrors.htp_id = 'HTPID is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await login(formData);
      toast.success('Login successful!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.response?.data?.non_field_errors?.[0] ||
                          'Login failed. Please check your credentials.';
      toast.error(errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2 font-orbitron tracking-wider group cursor-pointer transition-colors duration-300 hover:text-purple-primary">
            <span className="text-purple-primary">MISFITS</span>-BATTLE
          </h1>
          <p className="text-text-secondary font-rajdhani text-lg">
            Sign in to start competing
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-dark-surface border border-purple-primary/20 rounded-lg p-8 shadow-xl shadow-purple-primary/10">
          <h2 className="text-2xl font-bold text-text-primary mb-6 font-rajdhani">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* HTPID */}
            <div>
              <label 
                htmlFor="htp_id" 
                className="block text-sm font-medium text-text-primary mb-2 font-rajdhani"
              >
                HTPID
              </label>
              <input
                type="text"
                id="htp_id"
                name="htp_id"
                value={formData.htp_id}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-dark-bg border ${
                  errors.htp_id ? 'border-red-500' : 'border-purple-primary/30'
                } rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/20 transition-all font-rajdhani uppercase`}
                placeholder="e.g., HTP-2026-X7K2"
                disabled={loading}
                autoComplete="username"
              />
              {errors.htp_id && (
                <p className="mt-1 text-sm text-red-500 font-rajdhani">
                  {errors.htp_id}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="relative">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-text-primary mb-2 font-rajdhani"
              >
                Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-dark-bg border ${
                  errors.password ? 'border-red-500' : 'border-purple-primary/30'
                } rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/20 transition-all font-rajdhani pr-12`}
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-text-secondary hover:text-text-primary">
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500 font-rajdhani">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-dark hover:to-purple-primary disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-purple-primary/30 font-rajdhani"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-text-secondary text-sm font-rajdhani">
              <Link to="/reset-password" className="text-purple-primary hover:text-purple-secondary font-semibold">
                Forgot Password?
              </Link>
            </p>
            <p className="text-text-secondary text-sm font-rajdhani">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="text-purple-primary hover:text-purple-secondary font-semibold"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link 
            to="/" 
            className="text-text-secondary hover:text-purple-primary text-sm font-rajdhani transition-colors"
          >
            ← Back to home
          </Link>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6">
          <PrivacyNotice compact />
        </div>
      </div>
    </div>
  );
};
