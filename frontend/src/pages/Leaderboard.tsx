/**
 * Live Leaderboard — Professional competition leaderboard
 * Features: podium, rank movement, personal card, auto-refresh
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  avg_similarity: number;
  total_code_length: number;
  last_submission_time: string | null;
}

export const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<TeamEntry[]>([]);
  const [status, setStatus] = useState<'live' | 'frozen' | 'final'>('live');
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [teamProfile, setTeamProfile] = useState<any>(null);
  const prevRanks = useRef<Map<string, number>>(new Map());

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/leaderboard/');
      const data = res.data;
      
      // Track rank changes
      const newRanks = new Map<string, number>();
      for (const e of data.leaderboard) {
        newRanks.set(e.team_name, e.rank);
      }
      prevRanks.current = newRanks;
      
      setEntries(data.leaderboard);
      setStatus(data.status);
      setUpdatedAt(data.updated_at || '');
    } catch {}
    finally { setLoading(false); }
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

  const maxScore = entries.length > 0 ? entries[0].total_score : 1;

  const openTeamProfile = async (teamId: number) => {
    try {
      const res = await apiClient.get(`/api/teams/profile/${teamId}/`);
      setTeamProfile(res.data);
    } catch {}
  };
  const first = entries[0] || null;
  const second = entries[1] || null;
  const third = entries[2] || null;

  // Find user's team
  const myTeam = entries.find(e => 
    user && (user.htp_id === e.leader_htp_id || user.htp_id === e.member_htp_id)
  );
  const nextAbove = myTeam && myTeam.rank > 1 ? entries[myTeam.rank - 2] : null;
  const pointsToNext = nextAbove ? (nextAbove.total_score - myTeam!.total_score) : 0;

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-surface/50 backdrop-blur-sm border-b border-purple-primary/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold font-orbitron tracking-wider">
              <span className="text-purple-primary">LEADER</span>BOARD
            </h1>
            <span className={`px-2 py-0.5 rounded text-xs font-rajdhani font-semibold border ${
              status === 'live' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
              status === 'frozen' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
              'bg-gray-500/10 text-gray-400 border-gray-500/20'
            }`}>
              {status === 'live' && <><span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block mr-1 animate-pulse"></span>Live</>}
              {status === 'frozen' && user?.is_admin && 'Frozen'}
              {status === 'frozen' && !user?.is_admin && 'Live'}
              {status === 'final' && 'Final'}
            </span>
          </div>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-dark-bg hover:bg-dark-surface text-text-primary border border-purple-primary/30 hover:border-purple-primary rounded transition-all font-rajdhani font-semibold text-sm">
            Dashboard
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">

        {/* Personal Rank Card */}
        {myTeam && (
          <div className="bg-dark-surface border border-purple-primary/20 rounded-lg p-5">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold font-orbitron text-purple-primary">#{myTeam.rank}</p>
                <p className="text-xs text-text-secondary font-rajdhani">Your Rank</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-orbitron text-text-primary">{myTeam.total_score}</p>
                <p className="text-xs text-text-secondary font-rajdhani">Score</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-orbitron text-green-400">{myTeam.challenges_solved}</p>
                <p className="text-xs text-text-secondary font-rajdhani">Solved</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-orbitron text-text-primary">{(myTeam.avg_similarity * 100).toFixed(1)}%</p>
                <p className="text-xs text-text-secondary font-rajdhani">Avg Match</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-orbitron text-yellow-400">{pointsToNext > 0 ? `+${pointsToNext.toFixed(1)}` : '—'}</p>
                <p className="text-xs text-text-secondary font-rajdhani">To Next Rank</p>
              </div>
            </div>
          </div>
        )}

        {/* Podium */}
        {entries.length >= 3 && (
          <div className="flex items-end justify-center gap-3 mb-4">
            <PodiumCard entry={second!} place={2} height="h-28" />
            <PodiumCard entry={first!} place={1} height="h-36" />
            <PodiumCard entry={third!} place={3} height="h-22" />
          </div>
        )}

        {/* Score Distribution */}
        {entries.length > 0 && (
          <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-5">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider font-rajdhani mb-3">Score Distribution</h3>
            <div className="space-y-1.5">
              {entries.slice(0, 12).map((entry) => {
                const isMe = user && (user.htp_id === entry.leader_htp_id || user.htp_id === entry.member_htp_id);
                return (
                <div key={entry.rank} className={`flex items-center gap-2 ${isMe ? 'bg-purple-primary/5 rounded px-2 py-0.5' : ''}`}>
                  <span className="text-xs text-text-secondary font-mono w-5 text-right">{entry.rank}</span>
                  <span className={`text-xs font-rajdhani w-28 truncate ${isMe ? 'text-purple-primary font-semibold' : 'text-text-primary'}`}>{entry.team_name}</span>
                  <div className="flex-1 h-4 bg-dark-bg rounded overflow-hidden">
                    <div className={`h-full rounded transition-all duration-700 ${isMe ? 'bg-gradient-to-r from-purple-primary to-purple-tertiary' : 'bg-gradient-to-r from-purple-primary/60 to-purple-tertiary/60'}`} style={{ width: `${Math.max(3, (entry.total_score / maxScore) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-mono text-purple-primary w-12 text-right">{entry.total_score}</span>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Full Table */}
        <div className="bg-dark-surface border border-purple-primary/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-purple-primary/10">
                <tr>
                  <th className="text-left py-3 px-4 text-xs text-text-secondary uppercase tracking-wider font-rajdhani">#</th>
                  <th className="text-left py-3 px-4 text-xs text-text-secondary uppercase tracking-wider font-rajdhani">Team</th>
                  <th className="text-left py-3 px-4 text-xs text-text-secondary uppercase tracking-wider font-rajdhani">Members</th>
                  <th className="text-right py-3 px-4 text-xs text-text-secondary uppercase tracking-wider font-rajdhani">Score</th>
                  <th className="text-right py-3 px-4 text-xs text-text-secondary uppercase tracking-wider font-rajdhani">Solved</th>
                  <th className="text-right py-3 px-4 text-xs text-text-secondary uppercase tracking-wider font-rajdhani">Avg Match</th>
                  <th className="text-right py-3 px-4 text-xs text-text-secondary uppercase tracking-wider font-rajdhani">Last Sub</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isMe = user && (user.htp_id === entry.leader_htp_id || user.htp_id === entry.member_htp_id);
                  return (
                    <tr key={entry.rank} className={`border-b border-dark-border/30 transition-colors ${isMe ? 'bg-purple-primary/5' : 'hover:bg-purple-primary/5'}`}>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={entry.rank <= 3 ? (entry.rank === 1 ? 'text-yellow-400' : entry.rank === 2 ? 'text-gray-300' : 'text-orange-400') : 'text-text-primary'}>
                          {entry.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button onClick={() => openTeamProfile((entry as any).team_id)} className={`font-rajdhani font-semibold hover:underline ${isMe ? 'text-purple-primary' : 'text-text-primary hover:text-purple-primary'}`}>
                          {entry.team_name}
                        </button>
                        {isMe && <span className="ml-1 text-xs text-purple-primary/60">(You)</span>}
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-xs font-rajdhani">
                        {entry.leader_name}{entry.member_name ? ` & ${entry.member_name}` : ''}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-purple-primary">{entry.total_score}</td>
                      <td className="py-3 px-4 text-right font-mono text-text-secondary">{entry.challenges_solved}</td>
                      <td className="py-3 px-4 text-right font-mono text-text-secondary">{(entry.avg_similarity * 100).toFixed(1)}%</td>
                      <td className="py-3 px-4 text-right font-mono text-text-secondary text-xs">
                        {entry.last_submission_time ? new Date(entry.last_submission_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '—'}
                      </td>
                    </tr>
                  );
                })}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
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

        {/* Footer */}
        {updatedAt && (
          <p className="text-center text-text-secondary text-xs font-rajdhani">
            Last updated: {new Date(updatedAt).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Team Profile Modal */}
      {teamProfile && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-dark-bg/90 backdrop-blur-sm" onClick={() => setTeamProfile(null)}>
          <div className="bg-dark-surface border border-purple-primary/20 rounded-lg p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-text-primary font-orbitron">{teamProfile.name}</h2>
                <p className="text-text-secondary font-rajdhani">
                  {teamProfile.rank ? `#${teamProfile.rank}` : ''} • {teamProfile.total_score} pts • {teamProfile.challenges_solved} solved
                </p>
              </div>
              <button onClick={() => setTeamProfile(null)} className="text-text-secondary hover:text-text-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Members */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-rajdhani mb-2">Members</h3>
              <div className="space-y-2">
                {teamProfile.members.map((m: any) => (
                  <div key={m.htp_id} className="bg-dark-bg rounded p-2 border border-purple-primary/10 flex justify-between">
                    <span className="text-text-primary font-rajdhani font-semibold text-sm">{m.name}</span>
                    <span className="text-text-secondary font-mono text-xs">{m.htp_id}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Solves */}
            <div>
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-rajdhani mb-2">Solves</h3>
              {teamProfile.solves.length > 0 ? (
                <table className="w-full text-xs">
                  <thead className="border-b border-purple-primary/10">
                    <tr>
                      <th className="text-left py-2 text-text-secondary font-rajdhani">Challenge</th>
                      <th className="text-right py-2 text-text-secondary font-rajdhani">Score</th>
                      <th className="text-right py-2 text-text-secondary font-rajdhani">Match</th>
                      <th className="text-right py-2 text-text-secondary font-rajdhani">By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamProfile.solves.map((s: any, i: number) => (
                      <tr key={i} className="border-b border-dark-border/30">
                        <td className="py-1.5 text-text-primary font-rajdhani">{s.challenge}</td>
                        <td className="py-1.5 text-right font-mono text-purple-primary">{s.score}</td>
                        <td className="py-1.5 text-right font-mono text-text-secondary">{(s.similarity * 100).toFixed(1)}%</td>
                        <td className="py-1.5 text-right text-text-secondary font-rajdhani">{s.submitted_by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-text-secondary text-sm font-rajdhani">No solves yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Podium Card */
const PodiumCard: React.FC<{ entry: TeamEntry; place: number; height: string }> = ({ entry, place, height }) => {
  const colors = {
    1: { border: 'border-yellow-400/50', bg: 'bg-yellow-400/5', text: 'text-yellow-400', label: '1ST' },
    2: { border: 'border-gray-300/50', bg: 'bg-gray-300/5', text: 'text-gray-300', label: '2ND' },
    3: { border: 'border-orange-400/50', bg: 'bg-orange-400/5', text: 'text-orange-400', label: '3RD' },
  };
  const c = colors[place as 1 | 2 | 3];

  return (
    <div className="flex flex-col items-center w-36">
      <div className={`w-full ${height} ${c.bg} border ${c.border} rounded-t-lg flex flex-col items-center justify-end p-3`}>
        <span className={`text-xl font-bold font-orbitron ${c.text} mb-1`}>{c.label}</span>
        <span className="text-text-primary font-rajdhani font-semibold text-xs text-center truncate w-full">{entry.team_name}</span>
        <span className={`text-sm font-bold font-mono ${c.text}`}>{entry.total_score}</span>
      </div>
      <div className="text-xs text-text-secondary font-rajdhani mt-1 text-center truncate w-full">
        {entry.challenges_solved} solved
      </div>
    </div>
  );
};
