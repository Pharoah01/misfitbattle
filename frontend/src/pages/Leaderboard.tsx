/**
 * Leaderboard Page
 * Shows team rankings with podium + bar chart + full table.
 * Polls every 10 seconds for live updates (unless frozen).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';

interface TeamEntry {
  rank: number;
  team_name: string;
  leader_name: string;
  leader_htp_id: string;
  member_name: string | null;
  member_htp_id: string | null;
  total_score: number;
  challenges_solved: number;
  total_code_length: number;
  last_submission_time: string | null;
}

interface LeaderboardData {
  leaderboard: TeamEntry[];
  frozen: boolean;
}

export const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/leaderboard/');
      setData(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-primary"></div>
      </div>
    );
  }

  const entries = data?.leaderboard || [];
  const frozen = data?.frozen || false;
  const maxScore = entries.length > 0 ? entries[0].total_score : 1;

  // Top 3 for podium
  const first = entries[0] || null;
  const second = entries[1] || null;
  const third = entries[2] || null;

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-surface/50 backdrop-blur-sm border-b border-purple-primary/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-orbitron tracking-wider">
            <span className="text-purple-primary">LEADER</span>BOARD
          </h1>
          <div className="flex items-center gap-4">
            {frozen && user?.is_admin && (
              <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded text-xs font-rajdhani font-semibold">
                FROZEN
              </span>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-dark-bg hover:bg-dark-surface text-text-primary border border-purple-primary/30 hover:border-purple-primary rounded transition-all font-rajdhani font-semibold text-sm"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Podium */}
        {entries.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-12">
            {/* 2nd place */}
            <PodiumCard entry={second!} place={2} height="h-32" />
            {/* 1st place */}
            <PodiumCard entry={first!} place={1} height="h-40" />
            {/* 3rd place */}
            <PodiumCard entry={third!} place={3} height="h-24" />
          </div>
        )}

        {/* Bar Chart */}
        {entries.length > 0 && (
          <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-6 mb-8">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-rajdhani mb-4">Score Distribution</h3>
            <div className="space-y-2">
              {entries.slice(0, 15).map((entry) => (
                <div key={entry.rank} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary font-mono w-6 text-right">{entry.rank}</span>
                  <span className="text-xs text-text-primary font-rajdhani w-32 truncate">{entry.team_name}</span>
                  <div className="flex-1 h-5 bg-dark-bg rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-primary to-purple-tertiary rounded transition-all duration-500"
                      style={{ width: `${Math.max(2, (entry.total_score / maxScore) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-purple-primary w-14 text-right">{entry.total_score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Table */}
        <div className="bg-dark-surface border border-purple-primary/10 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-purple-primary/10">
              <tr>
                <th className="text-left py-3 px-4 text-xs text-text-secondary uppercase tracking-wider font-rajdhani">#</th>
                <th className="text-left py-3 px-4 text-xs text-text-secondary uppercase tracking-wider font-rajdhani">Team</th>
                <th className="text-left py-3 px-4 text-xs text-text-secondary uppercase tracking-wider font-rajdhani">Members</th>
                <th className="text-right py-3 px-4 text-xs text-text-secondary uppercase tracking-wider font-rajdhani">Score</th>
                <th className="text-right py-3 px-4 text-xs text-text-secondary uppercase tracking-wider font-rajdhani">Solved</th>
                <th className="text-right py-3 px-4 text-xs text-text-secondary uppercase tracking-wider font-rajdhani">Code</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isMyTeam = user && (user.htp_id === entry.leader_htp_id || user.htp_id === entry.member_htp_id);
                return (
                  <tr key={entry.rank} className={`border-b border-dark-border/30 transition-colors ${isMyTeam ? 'bg-purple-primary/5' : 'hover:bg-purple-primary/5'}`}>
                    <td className="py-3 px-4 font-mono font-bold text-text-primary">
                      {entry.rank <= 3 ? (
                        <span className={entry.rank === 1 ? 'text-yellow-400' : entry.rank === 2 ? 'text-gray-300' : 'text-orange-400'}>
                          {entry.rank}
                        </span>
                      ) : entry.rank}
                    </td>
                    <td className="py-3 px-4 font-rajdhani font-semibold text-text-primary">
                      {entry.team_name}
                      {isMyTeam && <span className="ml-2 text-xs text-purple-primary">(You)</span>}
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-xs font-rajdhani">
                      {entry.leader_name}{entry.member_name ? ` & ${entry.member_name}` : ''}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-purple-primary">{entry.total_score}</td>
                    <td className="py-3 px-4 text-right font-mono text-text-secondary">{entry.challenges_solved}</td>
                    <td className="py-3 px-4 text-right font-mono text-text-secondary">{entry.total_code_length}</td>
                  </tr>
                );
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="w-16 h-16 bg-purple-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-purple-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-text-primary font-rajdhani font-semibold text-lg mb-1">Leaderboard is empty</p>
                    <p className="text-text-secondary font-rajdhani text-sm">Scores will appear once submissions are processed</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* Podium Card Component */
const PodiumCard: React.FC<{ entry: TeamEntry; place: number; height: string }> = ({ entry, place, height }) => {
  const colors = {
    1: { border: 'border-yellow-400/50', bg: 'bg-yellow-400/5', text: 'text-yellow-400', label: '1ST' },
    2: { border: 'border-gray-300/50', bg: 'bg-gray-300/5', text: 'text-gray-300', label: '2ND' },
    3: { border: 'border-orange-400/50', bg: 'bg-orange-400/5', text: 'text-orange-400', label: '3RD' },
  };
  const c = colors[place as 1 | 2 | 3];

  return (
    <div className={`flex flex-col items-center w-40`}>
      <div className={`w-full ${height} ${c.bg} border ${c.border} rounded-t-lg flex flex-col items-center justify-end p-4`}>
        <span className={`text-2xl font-bold font-orbitron ${c.text} mb-1`}>{c.label}</span>
        <span className="text-text-primary font-rajdhani font-semibold text-sm text-center truncate w-full">{entry.team_name}</span>
        <span className={`text-lg font-bold font-mono ${c.text}`}>{entry.total_score}</span>
      </div>
      <div className="text-xs text-text-secondary font-rajdhani mt-2 text-center">
        {entry.leader_name}{entry.member_name ? ` & ${entry.member_name}` : ''}
      </div>
    </div>
  );
};
