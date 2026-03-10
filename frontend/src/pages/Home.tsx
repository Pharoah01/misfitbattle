/**
 * Home/Landing Page
 * Public page showing platform overview and challenge preview
 */

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useChallenges } from '@/hooks';
import { toast } from '@/utils';

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { data: challenges, isLoading } = useChallenges();

  // Security: Prevent screenshots, right-click, and drag-drop
  useEffect(() => {
    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Prevent drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Prevent all screenshot shortcuts (cross-platform)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Windows: PrtScn, Alt+PrtScn, Win+Shift+S, Shift+Win+S
      // Mac: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
      // Linux: PrtScn, Shift+PrtScn, Ctrl+PrtScn
      
      const isPrintScreen = e.key === 'PrintScreen';
      const isWindowsSnip = (e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 's' || e.key === 'S');
      const isWindowsSnipTool = e.metaKey && e.shiftKey && (e.key === 's' || e.key === 'S');
      const isMacScreenshot = e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key);
      const isLinuxScreenshot = e.ctrlKey && e.key === 'PrintScreen';
      
      if (isPrintScreen || isWindowsSnip || isWindowsSnipTool || isMacScreenshot || isLinuxScreenshot) {
        e.preventDefault();
        e.stopPropagation();
        toast.error('Screenshots are disabled');
        return false;
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyDown); // Also prevent on keyup

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyDown);
    };
  }, []);

  // Redirect authenticated users to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="border-b border-purple-primary/20 bg-dark-surface/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-text-primary font-orbitron tracking-wider group">
              <span className="text-purple-primary group-hover:text-purple-primary transition-colors duration-300">MISFITS</span><span className="group-hover:text-purple-primary transition-colors duration-300">-BATTLE</span>
            </h1>
            <div className="flex gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-text-primary hover:text-purple-primary transition-colors font-rajdhani font-semibold"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-6 py-2 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-dark hover:to-purple-primary text-white rounded font-rajdhani font-bold transition-all shadow-lg shadow-purple-primary/20"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-24 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-text-primary mb-6 font-orbitron tracking-tight">
            <span className="bg-gradient-to-r from-purple-primary via-purple-secondary to-purple-tertiary bg-clip-text text-transparent">
              Misfits-Battle
            </span>
            <br />
            CSS Styling Competition
          </h2>
          <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto font-rajdhani">
            Test your HTML/CSS skills. Solve challenges. Compete with others.
          </p>
          <Link
            to="/register"
            className="inline-block px-10 py-4 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-dark hover:to-purple-primary text-white font-bold rounded-lg text-lg transition-all shadow-2xl shadow-purple-primary/30 hover:shadow-purple-primary/50 font-rajdhani tracking-wide animate-glow"
          >
            Start Competing
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-text-primary mb-12 text-center font-orbitron">
          How It Works
        </h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center group">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-primary to-purple-secondary border-2 border-purple-primary/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-primary/20">
              <span className="text-3xl font-bold text-white font-orbitron">1</span>
            </div>
            <h4 className="text-lg font-semibold text-text-primary mb-2 font-rajdhani">
              Choose a Challenge
            </h4>
            <p className="text-text-secondary text-sm font-rajdhani">
              Browse challenges and pick one that interests you
            </p>
          </div>
          <div className="text-center group">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-secondary to-purple-tertiary border-2 border-purple-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-secondary/20">
              <span className="text-3xl font-bold text-white font-orbitron">2</span>
            </div>
            <h4 className="text-lg font-semibold text-text-primary mb-2 font-rajdhani">
              Write Your Code
            </h4>
            <p className="text-text-secondary text-sm font-rajdhani">
              Use HTML and CSS to recreate the target design
            </p>
          </div>
          <div className="text-center group">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-tertiary to-purple-light border-2 border-purple-tertiary/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-tertiary/20">
              <span className="text-3xl font-bold text-white font-orbitron">3</span>
            </div>
            <h4 className="text-lg font-semibold text-text-primary mb-2 font-rajdhani">
              Submit & Compete
            </h4>
            <p className="text-text-secondary text-sm font-rajdhani">
              Submit your solution and earn points
            </p>
          </div>
        </div>
      </section>

      {/* Challenge Preview */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-bold text-text-primary font-orbitron">
            Available Challenges
          </h3>
          <Link
            to="/login"
            className="text-purple-primary hover:text-purple-secondary transition-colors font-rajdhani font-semibold"
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
                className="bg-dark-surface border border-purple-primary/20 rounded-lg p-4 hover:border-purple-primary hover:shadow-lg hover:shadow-purple-primary/20 transition-all group"
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
                <h4 className="text-lg font-semibold text-text-primary mb-2 font-rajdhani group-hover:text-purple-primary transition-colors">
                  {challenge.title}
                </h4>
                <p className="text-text-secondary text-sm mb-3 line-clamp-2 font-rajdhani">
                  {challenge.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-orange-500 font-semibold font-rajdhani">
                    {challenge.points} points
                  </span>
                  <Link
                    to="/login"
                    className="text-sm text-text-secondary hover:text-purple-primary transition-colors font-rajdhani"
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
      <footer className="border-t border-purple-primary/20 mt-16 bg-dark-surface/50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-text-secondary text-sm font-rajdhani">
            <p>© 2026 <a href="https://binarymisfits.in.net" target="_blank" rel="noopener noreferrer" className="text-purple-primary hover:text-purple-secondary transition-colors">Binary Misfits</a>.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
