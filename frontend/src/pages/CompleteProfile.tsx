/**
 * Complete Profile Page
 * With HTP integration, profiles are auto-completed on registration.
 * This page handles edge cases where profile completion is still needed.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/utils/toast';

export const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    college_name: user?.college_name || '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await apiClient.post('/api/auth/complete-profile/', formData);
      
      await refreshUser();
      
      toast.success('Profile completed successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to complete profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-dark-surface border border-purple-primary/20 rounded-lg p-8 shadow-xl shadow-purple-primary/10">
          <h1 className="text-2xl font-bold text-text-primary mb-2 font-orbitron">
            Complete Your Profile
          </h1>
          <p className="text-text-secondary mb-6 font-rajdhani">
            Please verify your information to continue
          </p>

          {/* HTPID display (read-only) */}
          <div className="bg-dark-bg rounded-lg p-4 border border-purple-primary/10 mb-6">
            <label className="text-xs text-text-secondary uppercase tracking-wider block mb-1 font-rajdhani font-semibold">
              HTPID
            </label>
            <p className="text-lg text-text-primary font-mono">
              {user?.htp_id || user?.register_number}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2 font-rajdhani">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-bg border border-purple-primary/30 rounded-lg text-text-primary focus:outline-none focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/20 transition-all font-rajdhani"
                placeholder="Enter your full name"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500 font-rajdhani">{errors.name}</p>
              )}
            </div>

            {/* College Name Field */}
            <div>
              <label htmlFor="college_name" className="block text-sm font-medium text-text-primary mb-2 font-rajdhani">
                College/Institution
              </label>
              <input
                type="text"
                id="college_name"
                name="college_name"
                value={formData.college_name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-bg border border-purple-primary/30 rounded-lg text-text-primary focus:outline-none focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/20 transition-all font-rajdhani"
                placeholder="Your college (pre-filled from HTP)"
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-dark hover:to-purple-primary disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all font-rajdhani shadow-lg shadow-purple-primary/30"
            >
              {isSubmitting ? 'Completing Profile...' : 'Complete Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
