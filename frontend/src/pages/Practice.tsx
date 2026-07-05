/**
 * Practice Mode — unlimited submissions, separate leaderboard.
 * Available after competition ends or when admin enables it.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/utils';

interface Challenge {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
  points: number;
}

interface LeaderEntry {
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
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'challenges' | 'leaderboard'>('challenges');

  useEffect(() => {
    const init = async () => {
      try {
        const statusRes = await apiClient.get('/api/practice/status/');
        setEnabled(statusRes.data.enabled);
        if (statusRes.data.enabled) {
          const [challRes, lbRes] = await Promise.all([
            apiClient.get('/api/challenges/'),
            apiClient.get('/api/practice/leaderboard/').catch(() => ({ data: { leaderboard: [] } })),
          ]);
          const challData = challRes.data.results || challRes.data;
          setChallenges(Array.isArray(challData) ? challData : []);
          setLeaderboard(lbRes.data.leaderboard || []);
        }
      } catch {}
      setLoading(false);
    };
    init();
  }, []);

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
        <p className="text-text-secondary font-rajdhani mb-6 text-center">Practice mode is not available yet. It will be enabled after the competition ends.</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-gradient-to-r from-purple-primary to-purple-secondary text-white font-bold rounded-lg font-rajdhani">
          Back to Dashboard
        </button>
      </div>
    );
  }
