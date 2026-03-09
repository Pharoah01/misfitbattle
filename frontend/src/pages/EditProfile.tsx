/**
 * Edit Profile Page
 * Allows users to update their profile information
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/utils/toast';
import { COLLEGES, isValidCollege } from '@/config/colleges';

export const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    college_name: '',
    email: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load current user data
  useEffect(() => {
    if (user) {
      // If user's college is not in the predefined list, default to empty (they need to select one)
      const collegeValue = user.college_name && isValidCollege(user.college_name) 
        ? user.college_name 
        : '';
      
      setFormData({
        name: user.name || '',
        college_name: collegeValue,
        email: user.email || ''
      });
    }
  }, [user]);

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
    
    if (!formData.college_name.trim()) {
      newErrors.college_name = 'College name is required';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
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
      await apiClient.put('/api/auth/update-profile/', formData);
      
      // Refresh user data to get updated information
      await refreshUser();
      
      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-text-primary">Edit Profile</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-dark-surface border border-dark-border rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Register Number (Read-only) */}
            <div>
              <label htmlFor="register_number" className="block text-sm font-medium text-text-primary mb-2">
                Register Number
              </label>
              <input
                type="text"
                id="register_number"
                value={user?.register_number || ''}
                disabled
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded text-text-secondary cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-text-secondary">Register number cannot be changed</p>
            </div>

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                Full Name *
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

            {/* College Name Field */}
            <div>
              <label htmlFor="college_name" className="block text-sm font-medium text-text-primary mb-2">
                College/Institution *
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

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded text-text-primary focus:outline-none focus:border-primary"
                placeholder="Enter your email address"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-primary">{errors.email}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-dark-bg hover:bg-dark-border disabled:opacity-50 disabled:cursor-not-allowed text-text-primary border border-dark-border font-medium rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
