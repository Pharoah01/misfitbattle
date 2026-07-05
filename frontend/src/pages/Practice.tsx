/**
 * Practice Mode Page
 * Unlimited submissions, separate leaderboard, post-competition.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/utils';

interface PracticeChallenge {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
  points: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  htp_id: string;
  total_score: number;
  challenges_completed: number;
  avg_similarity: number;
}

export const Practice: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [challenges, setChallenges] = useState<PracticeChallenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'challenges' | 'leaderboard'>('challenges');

  useEffect(() => {
    const init = async () => {
      try {
        const [statusRes, challRes] = await Promise.all([
          apiClient.get('/api/practice/status/'),
          apiClient.get('/api/challenges/'),
        ]);
        setEnabled(statusRes.data.enabled);
        const results = challRes.data.results || challRes.data;
        setChallenges(Array.isArray(results) ? results : []);
      } catch {}
      setLoading(false);
    };
    init();
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/practice/leaderboard/');
      setLeaderboard(res.data.leaderboard || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (tab === 'leaderboard') fetchLeaderboard();
  }, [tab, fetchLeaderboard]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-primary"></div>
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl font-bold text-text-primary font-orbitron mb-4">Practice Mode</h1>
        <p className="text-text-secondary font-rajdhani mb-6">Practice mode is not available yet. Check back after the competition.</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-gradient-to-r from-purple-primary to-purple-secondary text-white font-bold rounded-lg font-rajdhani">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <header className="bg-dark-surface/50 backdrop-blur-sm border-b border-purple-primary/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-orbitron tracking-wider">
            <span className="text-purple-primary">PRACTICE</span> MODE
          </h1>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-dark-bg hover:bg-dark-surface text-text-primary border border-purple-primary/30 rounded transition-all font-rajdhani font-semibold text-sm">
            Dashboard
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-dark-surface border-b border-purple-primary/10 px-6 flex gap-1">
        <button onClick={() => setTab('challenges')} className={`px-4 py-3 text-sm font-semibold font-rajdhani border-b-2 transition-all ${tab === 'challenges' ? 'border-purple-primary text-purple-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
          Challenges
        </button>
        <button onClick={() => setTab('leaderboard')} className={`px-4 py-3 text-sm font-semibold font-rajdhani border-b-2 transition-all ${tab === 'leaderboard' ? 'border-purple-primary text-purple-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
          Leaderboard
        </button>
      </nav>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {tab === 'challenges' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map(c => (
              <div key={c.id} className="bg-dark-surface border border-purple-primary/10 rounded-lg p-5 hover:border-purple-primary/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-text-primary font-rajdhani font-semibold">{c.title}</h3>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${c.difficulty === 'easy' ? 'bg-green-500/10 text-green-400' : c.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>{c.difficulty}</span>
                    <span className="text-xs px-2 py-0.5 bg-purple-primary/10 text-purple-primary rounded">{c.points} pts</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/play/${c.slug}`)}
                  className="w-full py-2 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-dark hover:to-purple-primary text-white font-bold rounded transition-all font-rajdhani text-sm"
                >
                  Practice
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="bg-dark-surface border border-purple-primary/10 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-purple-primary/10">
                <tr>
                  <th className="text-left py-3 px-4 text-xs text-text-secondary font-rajdhani">#</th>
                  <th className="text-left py-3 px-4 text-xs text-text-secondary font-rajdhani">Name</th>
                  <th className="text-right py-3 px-4 text-xs text-text-secondary font-rajdhani">Score</th>
                  <th className="text-right py-3 px-4 text-xs text-text-secondary font-rajdhani">Solved</th>
                  <th className="text-right py-3 px-4 text-xs text-text-secondary font-rajdhani">Avg Match</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(entry => {
                  const isMe = user?.htp_id === entry.htp_id;
                  return (
                    <tr key={entry.rank} className={`border-b border-dark-border/30 ${isMe ? 'bg-purple-primary/5' : 'hover:bg-purple-primary/5'}`}>
                      <td className="py-3 px-4 font-mono font-bold text-text-primary">{entry.rank}</td>
                      <td className="py-3 px-4 font-rajdhani text-text-primary">
                        {entry.name}
                        {isMe && <span className="ml-1 text-xs text-purple-primary">(You)</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-purple-primary font-bold">{entry.total_score}</td>
                      <td className="py-3 px-4 text-right font-mono text-text-secondary">{entry.challenges_completed}</td>
                      <td className="py-3 px-4 text-right font-mono text-text-secondary">{(entry.avg_similarity * 100).toFixed(1)}%</td>
                    </tr>
                  );
                })}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-text-secondary font-rajdhani">No practice submissions yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
