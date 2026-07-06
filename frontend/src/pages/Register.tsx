/**
 * Register Page
 * Allows new users to create an account using their HTPID.
 * Name, email, and college are fetched automatically from the Hack The Planet API.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { toast } from '@/utils';
import { VALIDATION } from '@/config/constants';
import type { RegisterFormData } from '@/types';

export const Register: React.FC = () => {
  const { register, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    htp_id: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /**
   * Validate form data
   */
  const validate = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    if (!formData.htp_id.trim()) {
      newErrors.htp_id = 'HTPID is required';
    } else if (formData.htp_id.trim().length < 5) {
      newErrors.htp_id = 'Please enter a valid HTPID (e.g., HTP-2026-X7K2)';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await register(formData);
      toast.success('Registration successful! Welcome to Misfits Battle.');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.htp_id?.[0] ||
                          error.response?.data?.detail ||
                          'Registration failed. Please try again.';
      toast.error(errorMessage);
    }
  };

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2 font-orbitron tracking-wider group cursor-pointer transition-colors duration-300 hover:text-purple-primary">
            <span className="text-purple-primary">MISFITS</span>-BATTLE
          </h1>
          <p className="text-text-secondary font-rajdhani text-lg">
            Create your account to compete
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-dark-surface rounded-lg border border-purple-primary/20 p-8 shadow-xl shadow-purple-primary/10">
          <h2 className="text-2xl font-bold text-text-primary mb-2 font-rajdhani">
            Sign Up
          </h2>
          <p className="text-text-secondary text-sm mb-6 font-rajdhani">
            Your profile details will be fetched from your HTP account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* HTPID */}
            <div>
              <label 
                htmlFor="htp_id" 
                className="block text-sm font-medium text-text-secondary mb-2 font-rajdhani"
              >
                HTPID (Hack The Planet ID)
              </label>
              <input
                type="text"
                id="htp_id"
                name="htp_id"
                value={formData.htp_id}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-dark-bg border ${
                  errors.htp_id ? 'border-red-500' : 'border-purple-primary/30'
                } rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-purple-primary/20 focus:border-purple-primary transition-all font-rajdhani uppercase`}
                placeholder="e.g., HTP-2026-X7K2"
                disabled={loading}
                autoComplete="username"
              />
              {errors.htp_id && (
                <p className="mt-1 text-sm text-red-500 font-rajdhani">
                  {errors.htp_id}
                </p>
              )}
              <p className="mt-1 text-xs text-text-secondary font-rajdhani">
                From your Hack The Planet dashboard
              </p>
            </div>

            {/* Password */}
            <div className="relative">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-text-secondary mb-2 font-rajdhani"
              >
                Create Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-dark-bg border ${
                  errors.password ? 'border-red-500' : 'border-purple-primary/30'
                } rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-purple-primary/20 focus:border-purple-primary transition-all font-rajdhani pr-12`}
                placeholder="At least 8 characters"
                disabled={loading}
                autoComplete="new-password"
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

            {/* Confirm Password */}
            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium text-text-secondary mb-2 font-rajdhani"
              >
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-dark-bg border ${
                  errors.confirmPassword ? 'border-red-500' : 'border-purple-primary/30'
                } rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-purple-primary/20 focus:border-purple-primary transition-all font-rajdhani`}
                placeholder="Re-enter your password"
                disabled={loading}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500 font-rajdhani">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Info box */}
            <div className="bg-dark-bg/50 border border-purple-primary/10 rounded-lg p-3">
              <p className="text-text-secondary text-xs font-rajdhani text-center">
                Your profile details are pulled from Hack The Planet automatically.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-dark hover:to-purple-primary disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg shadow-purple-primary/30 font-rajdhani"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying HTPID...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-text-secondary text-sm font-rajdhani">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-purple-primary hover:text-purple-secondary font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-text-secondary text-sm font-rajdhani">
          <p>© 2026 Binary Misfits. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
