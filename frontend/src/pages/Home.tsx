/**
 * Home/Landing Page — Competition-focused with event branding
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import apiClient from '@/api/client';

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [timeToStart, setTimeToStart] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/lobby', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Fetch competition status for countdown
  useEffect(() => {
    apiClient.get('/api/submissions/competition-status/').then(res => {
      if (res.data.start_time) {
        setStartTime(new Date(res.data.start_time).getTime());
      }
    }).catch(() => {});
  }, []);

  // Countdown ticker
  useEffect(() => {
    if (!startTime) return;
    const tick = () => {
      const diff = Math.max(0, startTime - Date.now());
      if (diff <= 0) { setTimeToStart('Starting now'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeToStart(`${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="border-b border-purple-primary/20 bg-dark-surface/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary font-orbitron tracking-wider">
            <span className="text-purple-primary">MISFITS</span>-BATTLE
          </h1>
          <div className="flex gap-3">
            <Link to="/login" className="px-4 py-2 text-text-primary hover:text-purple-primary transition-colors font-rajdhani font-semibold">
              Sign In
            </Link>
            <Link to="/register" className="px-6 py-2 bg-gradient-to-r from-purple-primary to-purple-secondary text-white rounded font-rajdhani font-bold shadow-lg shadow-purple-primary/20">
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mb-4">
          <span className="px-4 py-1 bg-purple-primary/10 border border-purple-primary/20 rounded-full text-purple-primary text-sm font-rajdhani font-semibold">
            Hack The Planet presents
          </span>
        </div>
        <h2 className="text-5xl md:text-7xl font-bold text-text-primary mb-4 font-orbitron tracking-tight">
          <span className="bg-gradient-to-r from-purple-primary via-purple-secondary to-purple-tertiary bg-clip-text text-transparent">
            CSS Battle
          </span>
        </h2>
        <p className="text-xl text-text-secondary mb-8 max-w-xl mx-auto font-rajdhani">
          Recreate designs using pure HTML and CSS. Compete in teams. Climb the leaderboard.
        </p>

        {/* Countdown */}
        {timeToStart && (
          <div className="mb-8">
            <p className="text-sm text-text-secondary font-rajdhani mb-2">Competition starts in</p>
            <p className="text-4xl font-bold font-orbitron text-purple-primary tracking-wider">{timeToStart}</p>
          </div>
        )}

        <div className="flex justify-center gap-4">
          <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-purple-primary to-purple-secondary text-white font-bold rounded-lg text-lg font-rajdhani shadow-2xl shadow-purple-primary/30 hover:shadow-purple-primary/50 transition-all">
            Register Now
          </Link>
          <Link to="/login" className="px-8 py-4 bg-dark-surface border border-purple-primary/30 text-text-primary font-bold rounded-lg text-lg font-rajdhani hover:border-purple-primary transition-all">
            Sign In
          </Link>
        </div>
      </section>

      {/* Event Details */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-6 text-center">
            <p className="text-3xl font-bold font-orbitron text-purple-primary mb-2">6 hrs</p>
            <p className="text-text-secondary font-rajdhani">Competition Duration</p>
          </div>
          <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-6 text-center">
            <p className="text-3xl font-bold font-orbitron text-text-primary mb-2">17</p>
            <p className="text-text-secondary font-rajdhani">Challenges</p>
          </div>
          <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-6 text-center">
            <p className="text-3xl font-bold font-orbitron text-text-primary mb-2">Teams of 2</p>
            <p className="text-text-secondary font-rajdhani">Team Size</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-2xl font-bold text-text-primary mb-10 text-center font-orbitron">How It Works</h3>
        <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { num: '1', title: 'Register', desc: 'Sign up with your HTP ID' },
            { num: '2', title: 'Join Team', desc: 'Auto-paired from HTP registration' },
            { num: '3', title: 'Solve', desc: 'Recreate targets with HTML & CSS' },
            { num: '4', title: 'Score', desc: 'Pixel-perfect matching earns points' },
          ].map(step => (
            <div key={step.num} className="text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-primary to-purple-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-white font-orbitron">{step.num}</span>
              </div>
              <h4 className="text-text-primary font-rajdhani font-semibold mb-1">{step.title}</h4>
              <p className="text-text-secondary text-sm font-rajdhani">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scoring */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-8 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-text-primary mb-6 font-orbitron text-center">Scoring</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="inline-block px-3 py-1 bg-green-500/10 text-green-400 rounded text-xs font-rajdhani mb-2">Easy</span>
              <p className="text-2xl font-bold font-orbitron text-text-primary">50</p>
              <p className="text-xs text-text-secondary font-rajdhani">points each</p>
            </div>
            <div>
              <span className="inline-block px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded text-xs font-rajdhani mb-2">Medium</span>
              <p className="text-2xl font-bold font-orbitron text-text-primary">100</p>
              <p className="text-xs text-text-secondary font-rajdhani">points each</p>
            </div>
            <div>
              <span className="inline-block px-3 py-1 bg-red-500/10 text-red-400 rounded text-xs font-rajdhani mb-2">Hard</span>
              <p className="text-2xl font-bold font-orbitron text-text-primary">150</p>
              <p className="text-xs text-text-secondary font-rajdhani">points each</p>
            </div>
          </div>
          <p className="text-center text-text-secondary text-sm font-rajdhani mt-4">
            Score = Pixel Match % x Challenge Points. Higher similarity = more points.
          </p>
        </div>
      </section>

      {/* Rules Summary */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-text-primary mb-6 font-orbitron text-center">Rules</h3>
          <div className="space-y-3">
            {[
              'One submission per team per challenge',
              'HTML and internal CSS only — no frameworks',
              'No JavaScript allowed',
              'No AI code generators',
              'No copying from external sources',
              'Teams auto-formed from HTP registration',
            ].map((rule, i) => (
              <div key={i} className="flex items-center gap-3 bg-dark-surface border border-purple-primary/10 rounded-lg px-4 py-3">
                <span className="w-6 h-6 bg-purple-primary/10 text-purple-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                <span className="text-text-secondary font-rajdhani text-sm">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-primary/20 mt-8 bg-dark-surface/50">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-text-secondary text-sm font-rajdhani">
            Organized by <span className="text-purple-primary">Binary Misfits</span> | Hack The Planet
          </p>
        </div>
      </footer>
    </div>
  );
};
