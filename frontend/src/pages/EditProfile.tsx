/**
 * Edit Profile Page - Purple Cyber-Tech Theme
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
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
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
      const wasProfileIncomplete = user && !user.profile_completed;
      
      await apiClient.put('/api/auth/update-profile/', formData);
      
      // Refresh user data to get updated information
      await refreshUser();
      
      toast.success('Profile updated successfully!');
      
      // If profile was incomplete and now completed, redirect to dashboard
      if (wasProfileIncomplete) {
        toast.success('🎉 Profile completed! Welcome to Misfits Battle!');
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/profile');
      }
    } catch (error: any) {
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
      <header className="bg-dark-surface/50 backdrop-blur-sm border-b border-purple-primary/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="text-text-secondary hover:text-purple-primary transition-colors flex items-center gap-2 font-rajdhani font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="h-6 w-px bg-purple-primary/30"></div>
            <h1 className="text-2xl font-bold text-text-primary font-orbitron">
              <span className="bg-gradient-to-r from-purple-primary to-purple-tertiary bg-clip-text text-transparent">
                Edit Profile
              </span>
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-dark-surface rounded-lg border border-purple-primary/20 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Register Number (Read-only) */}
              <div>
                <label htmlFor="register_number" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 font-rajdhani">
                  Register Number
                </label>
                <input
                  type="text"
                  id="register_number"
                  value={user?.register_number || ''}
                  disabled
                  className="w-full px-4 py-3 bg-dark-bg/50 border border-purple-primary/10 rounded-lg text-text-secondary cursor-not-allowed font-mono"
                />
                <p className="mt-2 text-xs text-text-secondary font-rajdhani">Register number cannot be changed</p>
              </div>

              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 font-rajdhani">
                  Full Name <span className="text-purple-primary">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-dark-bg border border-purple-primary/20 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent transition-all font-rajdhani"
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-500 font-rajdhani">{errors.name}</p>
                )}
              </div>

              {/* College Name Field */}
              <div>
                <label htmlFor="college_name" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 font-rajdhani">
                  College/Institution <span className="text-purple-primary">*</span>
                </label>
                <select
                  id="college_name"
                  name="college_name"
                  value={formData.college_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-dark-bg border border-purple-primary/20 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent transition-all font-rajdhani appearance-none cursor-pointer"
                  disabled={isSubmitting}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B2DFF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="">Select your college</option>
                  {COLLEGES.map((college) => (
                    <option key={college} value={college}>
                      {college}
                    </option>
                  ))}
                </select>
                {errors.college_name && (
                  <p className="mt-2 text-sm text-red-500 font-rajdhani">{errors.college_name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 font-rajdhani">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-dark-bg border border-purple-primary/20 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent transition-all font-mono"
                  placeholder="your.email@example.com"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-500 font-rajdhani">{errors.email}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-dark-bg hover:bg-dark-surface disabled:opacity-50 disabled:cursor-not-allowed text-text-primary border border-purple-primary/30 hover:border-purple-primary font-bold rounded-lg transition-all font-rajdhani"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-dark hover:to-purple-primary disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all font-rajdhani shadow-lg shadow-purple-primary/30"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
