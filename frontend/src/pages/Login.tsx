/**
 * Login Page
 * Allows users to authenticate with register_number and password
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
    register_number: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log('Login: User is authenticated, redirecting');
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location]);

  const validate = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.register_number.trim()) {
      newErrors.register_number = 'Register number is required';
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
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.non_field_errors?.[0] ||
                          'Login failed. Please check your credentials.';
      toast.error(errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // For register_number, only allow numeric characters
    if (name === 'register_number') {
      // Remove any non-numeric characters
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
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
            {/* Register Number */}
            <div>
              <label 
                htmlFor="register_number" 
                className="block text-sm font-medium text-text-primary mb-2 font-rajdhani"
              >
                Register Number
              </label>
              <input
                type="number"
                id="register_number"
                name="register_number"
                value={formData.register_number}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-dark-bg border ${
                  errors.register_number ? 'border-red-500' : 'border-purple-primary/30'
                } rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/20 transition-all font-rajdhani`}
                placeholder="Enter your register number (numbers only)"
                disabled={loading}
              />
              {errors.register_number && (
                <p className="mt-1 text-sm text-red-500 font-rajdhani">
                  {errors.register_number}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-text-primary mb-2 font-rajdhani"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-dark-bg border ${
                  errors.password ? 'border-red-500' : 'border-purple-primary/30'
                } rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/20 transition-all font-rajdhani`}
                placeholder="Enter your password"
                disabled={loading}
              />
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
          <div className="mt-6 text-center">
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
