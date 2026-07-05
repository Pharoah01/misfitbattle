/**
 * Team Page - Create or Join a team of 2
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/utils';
import { validateTeamName } from '@/utils/teamNameValidation';
import { PixelDiffViewer } from '@/components/PixelDiffViewer';

interface TeamData {
  id: number;
  name: string;
  invite_code: string;
  is_full: boolean;
  leader_name: string;
  leader_htp_id: string;
  member_name: string | null;
  member_htp_id: string | null;
  created_at: string;
}

export const Team: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [viewingSubmission, setViewingSubmission] = useState<number | null>(null);

  const fetchTeam = async () => {
    try {
      const res = await apiClient.get('/api/teams/my-team/');
      setTeam(res.data.team);
      if (res.data.team) {
        // Fetch dashboard data
        try {
          const dashRes = await apiClient.get('/api/teams/dashboard/');
          setDashboardData(dashRes.data);
        } catch {}
      }
    } catch {
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchTeam(); 
    const interval = setInterval(fetchTeam, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    const validation = validateTeamName(teamName);
    if (!validation.valid) {
      toast.error(validation.reason || 'Invalid team name');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post('/api/teams/create/', { name: validation.sanitized });
      setTeam(res.data.team);
      toast.success('Team created!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.name?.[0] || 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post('/api/teams/join/', { invite_code: inviteCode.trim() });
      setTeam(res.data.team);
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to join team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeave = async () => {
    setSubmitting(true);
    try {
      const res = await apiClient.post('/api/teams/leave/');
      setTeam(null);
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to leave team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoSolo = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await apiClient.post('/api/teams/go-solo/');
      await fetchTeam();
      toast.success('You are now a solo participant');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to proceed solo');
    } finally {
      setSubmitting(false);
    }
  };

  const copyInviteCode = () => {
    if (team?.invite_code) {
      navigator.clipboard.writeText(team.invite_code);
      toast.success('Invite code copied!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-primary"></div>
      </div>
    );
  }

  // User already has a team — show team dashboard
  if (team) {
    const isLeader = user?.htp_id === team.leader_htp_id;
    const stats = dashboardData?.stats;
    const challenges = dashboardData?.challenges || [];
    const members = dashboardData?.members || [];
    const contributions = dashboardData?.contributions || [];

    return (
      <div className="min-h-screen bg-dark-bg">
        {viewingSubmission && (
          <PixelDiffViewer submissionId={viewingSubmission} onClose={() => setViewingSubmission(null)} />
        )}
        <header className="bg-dark-surface/50 backdrop-blur-sm border-b border-purple-primary/20">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold font-orbitron">
              <span className="text-purple-primary">TEAM</span> DASHBOARD
            </h1>
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-dark-bg hover:bg-dark-surface text-text-primary border border-purple-primary/30 rounded transition-all font-rajdhani font-semibold">
              Challenges
            </button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">

          {/* Team Overview */}
          <div className="bg-dark-surface rounded-lg border border-purple-primary/20 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-text-primary font-orbitron">{team.name}</h2>
                <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary font-rajdhani">
                  <span>Code: <span className="font-mono text-purple-primary">{team.invite_code}</span></span>
                  <span>{team.is_full ? '2/2 Members' : '1/2 Members'}</span>
                  {stats?.rank && <span>Rank: <span className="text-purple-primary font-bold">#{stats.rank}</span></span>}
                </div>
              </div>
              {!team.is_full && (
                <button onClick={handleGoSolo} disabled={submitting} className="px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded font-rajdhani font-semibold text-sm">
                  Proceed Solo
                </button>
              )}
            </div>
          </div>

          {/* Stats Row */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-4 text-center">
                <p className="text-xl font-bold font-orbitron text-purple-primary">{stats.total_score}</p>
                <p className="text-xs text-text-secondary font-rajdhani">Score</p>
              </div>
              <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-4 text-center">
                <p className="text-xl font-bold font-orbitron text-green-400">{stats.completed}/{stats.total_challenges}</p>
                <p className="text-xs text-text-secondary font-rajdhani">Solved</p>
              </div>
              <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-4 text-center">
                <p className="text-xl font-bold font-orbitron text-text-primary">{stats.rank ? `#${stats.rank}` : '—'}</p>
                <p className="text-xs text-text-secondary font-rajdhani">Rank</p>
              </div>
              <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-4 text-center">
                <p className="text-xl font-bold font-orbitron text-text-primary">{(stats.avg_similarity * 100).toFixed(1)}%</p>
                <p className="text-xs text-text-secondary font-rajdhani">Avg Match</p>
              </div>
              <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-4 text-center">
                <p className="text-xl font-bold font-orbitron text-text-primary">{stats.total_code_length}</p>
                <p className="text-xs text-text-secondary font-rajdhani">Total Code</p>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {stats && (
            <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-4">
              <div className="flex justify-between text-xs text-text-secondary font-rajdhani mb-2">
                <span>Progress</span>
                <span>{stats.completed}/{stats.total_challenges} challenges</span>
              </div>
              <div className="w-full h-3 bg-dark-bg rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-primary to-purple-tertiary rounded-full transition-all duration-500" style={{ width: `${(stats.completed / Math.max(stats.total_challenges, 1)) * 100}%` }}></div>
              </div>
            </div>
          )}

          {/* Members & Contributions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((m: any, i: number) => {
              const contrib = contributions[i];
              return (
                <div key={m.htp_id} className="bg-dark-surface border border-purple-primary/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${m.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                      <span className="text-text-primary font-rajdhani font-semibold">{m.name}</span>
                    </div>
                    <span className="text-xs bg-purple-primary/10 text-purple-primary px-2 py-0.5 rounded font-rajdhani">
                      {m.is_leader ? 'Leader' : 'Member'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary font-mono mb-3">{m.htp_id}</p>
                  {contrib && (
                    <>
                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                        <div>
                          <p className="text-sm font-bold text-text-primary font-mono">{contrib.challenges_submitted}</p>
                          <p className="text-xs text-text-secondary font-rajdhani">Solved</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary font-mono">{contrib.total_points}</p>
                          <p className="text-xs text-text-secondary font-rajdhani">Points</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary font-mono">{(contrib.avg_similarity * 100).toFixed(1)}%</p>
                          <p className="text-xs text-text-secondary font-rajdhani">Avg</p>
                        </div>
                      </div>
                      {/* Contribution bar */}
                      {stats && stats.total_score > 0 && (
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-text-secondary font-rajdhani mb-1">
                            <span>Contribution</span>
                            <span>{Math.round((contrib.total_points / stats.total_score) * 100)}%</span>
                          </div>
                          <div className="w-full h-2 bg-dark-bg rounded-full overflow-hidden">
                            <div className="h-full bg-purple-primary rounded-full" style={{ width: `${(contrib.total_points / stats.total_score) * 100}%` }}></div>
                          </div>
                        </div>
                      )}
                      {contrib.best_challenge && (
                        <p className="text-xs text-text-secondary font-rajdhani">
                          Best: <span className="text-purple-primary">{contrib.best_challenge.title}</span> ({contrib.best_challenge.score} pts)
                        </p>
                      )}
                      {contrib.last_submission_time && (
                        <p className="text-xs text-text-secondary font-rajdhani mt-1">
                          Last: {new Date(contrib.last_submission_time).toLocaleTimeString()}
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Challenge Progress Table */}
          <div className="bg-dark-surface rounded-lg border border-purple-primary/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-purple-primary/10">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-rajdhani">Challenge Progress</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-purple-primary/10">
                  <tr>
                    <th className="text-left py-2 px-4 text-xs text-text-secondary font-rajdhani">Challenge</th>
                    <th className="text-left py-2 px-4 text-xs text-text-secondary font-rajdhani">Status</th>
                    <th className="text-left py-2 px-4 text-xs text-text-secondary font-rajdhani">By</th>
                    <th className="text-left py-2 px-4 text-xs text-text-secondary font-rajdhani">Time</th>
                    <th className="text-right py-2 px-4 text-xs text-text-secondary font-rajdhani">Match</th>
                    <th className="text-right py-2 px-4 text-xs text-text-secondary font-rajdhani">Score</th>
                    <th className="text-right py-2 px-4 text-xs text-text-secondary font-rajdhani">Code</th>
                    <th className="text-center py-2 px-4 text-xs text-text-secondary font-rajdhani"></th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.map((c: any) => {
                    return (
                    <tr key={c.id} className="border-b border-dark-border/30 hover:bg-purple-primary/5">
                      <td className="py-2 px-4 font-rajdhani">
                        {c.title}
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${c.difficulty === 'easy' ? 'bg-green-500/10 text-green-400' : c.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>{c.difficulty}</span>
                      </td>
                      <td className="py-2 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded font-rajdhani ${
                          c.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                          c.status === 'scoring' ? 'bg-purple-primary/10 text-purple-primary' :
                          c.status === 'rendering' ? 'bg-blue-500/10 text-blue-400' :
                          c.status === 'queued' ? 'bg-gray-500/10 text-gray-400' :
                          c.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                          c.status === 'locked' ? 'bg-red-500/10 text-red-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                          {c.status === 'not_started' ? 'Not Started' : c.status === 'rendering' ? 'Rendering...' : c.status === 'scoring' ? 'Scoring...' : c.status === 'queued' ? 'Queued' : c.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-text-secondary font-rajdhani text-xs">{c.submitted_by || '—'}</td>
                      <td className="py-2 px-4 text-text-secondary font-mono text-xs">{c.submitted_at ? new Date(c.submitted_at).toLocaleTimeString() : '—'}</td>
                      <td className="py-2 px-4 text-right font-mono text-purple-primary">{c.similarity_score ? (c.similarity_score * 100).toFixed(1) + '%' : '—'}</td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-text-primary">{c.score ?? '—'}</td>
                      <td className="py-2 px-4 text-right font-mono text-text-secondary">{c.code_length ?? '—'}</td>
                      <td className="py-2 px-4 text-center">
                        {c.status === 'completed' && c.submission_id && (
                          <button onClick={() => setViewingSubmission(c.submission_id)} className="text-xs text-green-400 border border-green-500/30 px-2 py-0.5 rounded hover:bg-green-500/10 font-rajdhani">View</button>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Timeline */}
          {dashboardData?.activities && dashboardData.activities.length > 0 && (
            <div className="bg-dark-surface rounded-lg border border-purple-primary/10 p-4">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider font-rajdhani mb-3">Recent Activity</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {dashboardData.activities.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="text-text-secondary font-mono w-16 flex-shrink-0">{new Date(a.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                    <span className="text-text-primary font-rajdhani">{a.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button onClick={() => navigate('/leaderboard')} className="px-4 py-3 bg-dark-surface border border-purple-primary/10 rounded-lg text-text-primary font-rajdhani font-semibold text-sm hover:border-purple-primary/30 transition-all">Leaderboard</button>
            <button onClick={() => navigate('/dashboard')} className="px-4 py-3 bg-dark-surface border border-purple-primary/10 rounded-lg text-text-primary font-rajdhani font-semibold text-sm hover:border-purple-primary/30 transition-all">Challenges</button>
            <button onClick={copyInviteCode} className="px-4 py-3 bg-dark-surface border border-purple-primary/10 rounded-lg text-text-primary font-rajdhani font-semibold text-sm hover:border-purple-primary/30 transition-all">Copy Invite</button>
            <button onClick={handleLeave} disabled={submitting} className="px-4 py-3 bg-red-600/5 border border-red-600/20 rounded-lg text-red-400 font-rajdhani font-semibold text-sm hover:border-red-600/40 transition-all">
              {isLeader ? 'Delete Team' : 'Leave'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No team — show create/join
  return (
    <div className="min-h-screen bg-dark-bg">
      <header className="bg-dark-surface/50 backdrop-blur-sm border-b border-purple-primary/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-orbitron">
            <span className="text-purple-primary">TEAM</span>
          </h1>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-dark-bg hover:bg-dark-surface text-text-primary border border-purple-primary/30 rounded transition-all font-rajdhani font-semibold">
            Dashboard
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="bg-dark-surface rounded-lg border border-purple-primary/20 p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-2 font-orbitron text-center">Team Up</h2>
          <p className="text-text-secondary text-center mb-8 font-rajdhani">Create a team or join one with an invite code</p>

          {/* Tabs */}
          <div className="flex mb-6 bg-dark-bg rounded-lg p-1">
            <button
              onClick={() => setTab('create')}
              className={`flex-1 py-2 rounded-md font-rajdhani font-semibold transition-all ${tab === 'create' ? 'bg-purple-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Create Team
            </button>
            <button
              onClick={() => setTab('join')}
              className={`flex-1 py-2 rounded-md font-rajdhani font-semibold transition-all ${tab === 'join' ? 'bg-purple-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Join Team
            </button>
          </div>

          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 font-rajdhani">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-bg border border-purple-primary/20 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-primary transition-all font-rajdhani"
                  placeholder="Enter team name"
                  disabled={submitting}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !teamName.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-dark hover:to-purple-primary disabled:opacity-50 text-white font-bold rounded-lg transition-all font-rajdhani shadow-lg shadow-purple-primary/30"
              >
                {submitting ? 'Creating...' : 'Create Team'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 font-rajdhani">Invite Code</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full px-4 py-3 bg-dark-bg border border-purple-primary/20 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-primary transition-all font-mono text-center text-2xl tracking-widest uppercase"
                  placeholder="ABC123"
                  disabled={submitting}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || inviteCode.length < 6}
                className="w-full py-3 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-dark hover:to-purple-primary disabled:opacity-50 text-white font-bold rounded-lg transition-all font-rajdhani shadow-lg shadow-purple-primary/30"
              >
                {submitting ? 'Joining...' : 'Join Team'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
