/**
 * Register Page
 * Allows new users to create an account
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
    register_number: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});

  // Redirect if already authenticated
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

    // Register number validation
    if (!formData.register_number.trim()) {
      newErrors.register_number = 'Register number is required';
    } else if (!VALIDATION.REGISTER_NUMBER_PATTERN.test(formData.register_number)) {
      newErrors.register_number = 'Register number must be 3-20 alphanumeric characters';
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`;
    }

    // Confirm password validation
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
      toast.success('Registration successful! Redirecting...');
    } catch (error: any) {
      const errorMessage = error.response?.data?.register_number?.[0] ||
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
    
    // Clear error for this field
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            Misfits-Battle
          </h1>
          <p className="text-text-secondary">
            Create your account to start competing
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-dark-surface rounded-lg border border-dark-border p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Sign Up
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Register Number */}
            <div>
              <label 
                htmlFor="register_number" 
                className="block text-sm font-medium text-text-secondary mb-2"
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
                } rounded text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                placeholder="e.g., CS2021001"
                disabled={loading}
              />
              {errors.register_number && (
                <p className="mt-1 text-sm text-primary">
                  {errors.register_number}
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label 
                htmlFor="name" 
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-dark-surface border ${
                  errors.name ? 'border-primary' : 'border-dark-border'
                } rounded text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                placeholder="Enter your full name"
                disabled={loading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-primary">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-dark-surface border ${
                  errors.email ? 'border-primary' : 'border-dark-border'
                } rounded text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                placeholder="your.email@example.com"
                disabled={loading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-primary">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-text-secondary mb-2"
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
                } rounded text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                placeholder="At least 8 characters"
                disabled={loading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-primary">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-dark-surface border ${
                  errors.confirmPassword ? 'border-primary' : 'border-dark-border'
                } rounded text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                placeholder="Re-enter your password"
                disabled={loading}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-primary">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-text-secondary text-sm">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-primary hover:text-primary-light font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-text-secondary text-sm">
          <p>© 2026 Binary Misfits. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
