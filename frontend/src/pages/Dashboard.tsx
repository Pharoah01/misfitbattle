/**
 * Dashboard Page
 * Main page showing challenge list and user stats
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useChallenges } from '@/hooks';
import { SkeletonLoader, ErrorState } from '@/components';
import type { Challenge } from '@/types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'points' | '-points'>('points');
  
  const { data: challenges, isLoading, error, refetch } = useChallenges({
    search: searchTerm,
    ordering: sortBy,
  });

  /**
   * Handle challenge selection
   */
  const handleChallengeClick = (challengeId: number) => {
    navigate(`/challenge/${challengeId}`);
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header / Top Bar */}
      <header className="bg-dark-surface border-b border-dark-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-text-primary">Misfits-Battle</h1>
            <div className="flex items-center gap-4">
              <span className="text-text-secondary hidden sm:inline">
                {user?.name}
              </span>
              <button
                onClick={() => navigate('/profile')}
                className="px-4 py-2 bg-dark-bg hover:bg-dark-border text-text-primary border border-dark-border rounded transition-colors"
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Section Title */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-text-primary mb-2">Challenges</h2>
          <p className="text-text-secondary">Choose a challenge and start coding</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search challenges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'points' | '-points')}
            className="px-4 py-2 bg-dark-surface border border-dark-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="points">Points: Low to High</option>
            <option value="-points">Points: High to Low</option>
          </select>
        </div>

        {/* Challenge Grid - Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader type="card" count={6} />
          </div>
        )}

        {/* Challenge Grid - Error State */}
        {error && !isLoading && (
          <ErrorState 
            message="Failed to load challenges. Please check your connection and try again."
            onRetry={() => refetch()}
          />
        )}

        {/* Challenge Grid - Success State */}
        {!isLoading && !error && challenges && (
          <>
            {challenges.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {challenges.map((challenge: Challenge) => (
                  <div
                    key={challenge.id}
                    className="bg-dark-surface rounded border border-dark-border hover:border-primary cursor-pointer transition-all group"
                  >
                    {/* Challenge Preview Image */}
                    <div className="relative overflow-hidden bg-dark-bg">
                      {challenge.preview_image ? (
                        <img
                          src={challenge.preview_image}
                          alt={challenge.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center">
                          <span className="text-text-secondary text-sm">No preview</span>
                        </div>
                      )}
                    </div>

                    {/* Challenge Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-text-primary flex-1 group-hover:text-primary transition-colors">
                          {challenge.title}
                        </h3>
                        <span className="ml-2 px-2 py-1 bg-primary text-white text-xs font-medium rounded">
                          {challenge.points} pts
                        </span>
                      </div>

                      <p className="text-text-secondary text-sm line-clamp-2 mb-4">
                        {challenge.description}
                      </p>

                      {/* Color Palette */}
                      {challenge.palette && challenge.palette.length > 0 && (
                        <div className="flex gap-2 mb-4">
                          {challenge.palette.slice(0, 5).map((color, index) => (
                            <div
                              key={index}
                              className="w-6 h-6 rounded border border-dark-border"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      )}

                      <button 
                        onClick={() => handleChallengeClick(challenge.id)}
                        className="w-full py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded transition-colors"
                      >
                        Play
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="mb-4">
                  <svg 
                    className="w-16 h-16 mx-auto text-text-secondary" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  No challenges found
                </h3>
                <p className="text-text-secondary mb-6">
                  {searchTerm 
                    ? 'Try adjusting your search or filters' 
                    : 'Check back later for new challenges'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
