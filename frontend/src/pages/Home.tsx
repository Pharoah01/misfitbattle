/**
 * Home/Landing Page
 * Public page showing platform overview and challenge preview
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useChallenges } from '@/hooks';

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { data: challenges, isLoading } = useChallenges();

  // Redirect authenticated users to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="border-b border-dark-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-text-primary">
              Misfits-Battle
            </h1>
            <div className="flex gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-text-primary hover:text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
          CSSBattle-Style Coding Competition
        </h2>
        <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
          Test your HTML/CSS skills. Solve challenges. Compete with others.
        </p>
        <Link
          to="/register"
          className="inline-block px-8 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded text-lg transition-colors"
        >
          Start Competing
        </Link>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-12">
        <h3 className="text-2xl font-bold text-text-primary mb-8 text-center">
          How It Works
        </h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-dark-surface border border-dark-border rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h4 className="text-lg font-semibold text-text-primary mb-2">
              Choose a Challenge
            </h4>
            <p className="text-text-secondary text-sm">
              Browse challenges and pick one that interests you
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-dark-surface border border-dark-border rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h4 className="text-lg font-semibold text-text-primary mb-2">
              Write Your Code
            </h4>
            <p className="text-text-secondary text-sm">
              Use HTML and CSS to recreate the target design
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-dark-surface border border-dark-border rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h4 className="text-lg font-semibold text-text-primary mb-2">
              Submit & Compete
            </h4>
            <p className="text-text-secondary text-sm">
              Submit your solution and earn points
            </p>
          </div>
        </div>
      </section>

      {/* Challenge Preview */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-text-primary">
            Available Challenges
          </h3>
          <Link
            to="/login"
            className="text-primary hover:text-primary-light transition-colors"
          >
            Sign in to play →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-dark-surface border border-dark-border rounded-lg p-4">
                <div className="animate-pulse">
                  <div className="w-full h-32 bg-dark-border rounded mb-4"></div>
                  <div className="h-6 bg-dark-border rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-dark-border rounded w-full mb-2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : challenges && challenges.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {challenges.slice(0, 6).map((challenge) => (
              <div
                key={challenge.id}
                className="bg-dark-surface border border-dark-border rounded-lg p-4 hover:border-primary transition-colors"
              >
                {challenge.preview_image && (
                  <div className="mb-4 rounded overflow-hidden bg-dark-border">
                    <img
                      src={challenge.preview_image}
                      alt={challenge.title}
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}
                <h4 className="text-lg font-semibold text-text-primary mb-2">
                  {challenge.title}
                </h4>
                <p className="text-text-secondary text-sm mb-3 line-clamp-2">
                  {challenge.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-primary font-medium">
                    {challenge.points} points
                  </span>
                  <Link
                    to="/login"
                    className="text-sm text-text-secondary hover:text-primary transition-colors"
                  >
                    Sign in to play
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-text-secondary">
              No challenges available yet. Check back soon!
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-text-secondary text-sm">
            <p>© 2026 Binary Misfits.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
