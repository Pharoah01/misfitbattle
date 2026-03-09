/**
 * Complete Profile Page
 * Collects required profile information after signup
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/utils/toast';
import { COLLEGES } from '@/config/colleges';

export const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    register_number: '',
    college_name: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.register_number.trim()) {
      newErrors.register_number = 'Register number is required';
    }
    
    if (!formData.college_name.trim()) {
      newErrors.college_name = 'College name is required';
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
      
      // Refresh user data to get updated profile_completed status
      await refreshUser();
      
      toast.success('Profile completed successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Profile completion error:', error);
      
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
        <div className="bg-dark-surface border border-dark-border rounded-lg p-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Complete Your Profile
          </h1>
          <p className="text-text-secondary mb-6">
            Please provide the following information to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded text-text-primary focus:outline-none focus:border-primary"
                placeholder="Enter your full name"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-primary">{errors.name}</p>
              )}
            </div>

            {/* Register Number Field */}
            <div>
              <label htmlFor="register_number" className="block text-sm font-medium text-text-primary mb-2">
                Register Number
              </label>
              <input
                type="text"
                id="register_number"
                name="register_number"
                value={formData.register_number}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded text-text-primary focus:outline-none focus:border-primary"
                placeholder="Enter your register number"
                disabled={isSubmitting}
              />
              {errors.register_number && (
                <p className="mt-1 text-sm text-primary">{errors.register_number}</p>
              )}
            </div>

            {/* College Name Field */}
            <div>
              <label htmlFor="college_name" className="block text-sm font-medium text-text-primary mb-2">
                College/Institution
              </label>
              <select
                id="college_name"
                name="college_name"
                value={formData.college_name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded text-text-primary focus:outline-none focus:border-primary"
                disabled={isSubmitting}
              >
                <option value="">Select your college</option>
                {COLLEGES.map((college) => (
                  <option key={college} value={college}>
                    {college}
                  </option>
                ))}
              </select>
              {errors.college_name && (
                <p className="mt-1 text-sm text-primary">{errors.college_name}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded transition-colors"
            >
              {isSubmitting ? 'Completing Profile...' : 'Complete Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
