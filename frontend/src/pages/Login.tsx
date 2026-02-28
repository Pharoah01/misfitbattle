/**
 * Login Page
 * Allows users to authenticate with register_number and password
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { toast } from '@/utils';
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
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

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
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            Misfits-Battle
          </h1>
          <p className="text-text-secondary">
            Sign in to start competing
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-dark-surface border border-dark-border rounded-lg p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Register Number */}
            <div>
              <label 
                htmlFor="register_number" 
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Register Number
              </label>
              <input
                type="text"
                id="register_number"
                name="register_number"
                value={formData.register_number}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-dark-surface border ${
                  errors.register_number ? 'border-primary' : 'border-dark-border'
                } rounded text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary`}
                placeholder="Enter your register number"
                disabled={loading}
              />
              {errors.register_number && (
                <p className="mt-1 text-sm text-primary">
                  {errors.register_number}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-dark-surface border ${
                  errors.password ? 'border-primary' : 'border-dark-border'
                } rounded text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary`}
                placeholder="Enter your password"
                disabled={loading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-primary">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded transition-colors duration-200"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-text-secondary text-sm">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="text-primary hover:text-primary-light font-medium"
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
            className="text-text-secondary hover:text-text-primary text-sm"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};
