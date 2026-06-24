/**
 * Team Page - Create or Join a team of 2
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/utils';
import { validateTeamName } from '@/utils/teamNameValidation';

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

  const fetchTeam = async () => {
    try {
      const res = await apiClient.get('/api/teams/my-team/');
      setTeam(res.data.team);
    } catch {
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeam(); }, []);

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

  // User already has a team — show team view
  if (team) {
    const isLeader = user?.htp_id === team.leader_htp_id;
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
            <h2 className="text-3xl font-bold text-text-primary mb-1 font-orbitron text-center">{team.name}</h2>
            <p className="text-text-secondary text-center mb-8 font-rajdhani">
              {team.is_full ? 'Team is ready' : 'Waiting for teammate...'}
            </p>

            {/* Invite Code */}
            {!team.is_full && (
              <div className="bg-dark-bg rounded-lg p-4 border border-purple-primary/20 mb-6 text-center">
                <p className="text-xs text-text-secondary uppercase tracking-wider mb-2 font-rajdhani">Invite Code</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl font-mono font-bold text-purple-primary tracking-widest">{team.invite_code}</span>
                  <button onClick={copyInviteCode} className="p-2 hover:bg-purple-primary/10 rounded transition-colors" title="Copy">
                    <svg className="w-5 h-5 text-purple-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-text-secondary mt-2 font-rajdhani">Share this code with your teammate</p>
              </div>
            )}

            {/* Members */}
            <div className="space-y-3 mb-6">
              <div className="bg-dark-bg rounded-lg p-4 border border-purple-primary/10 flex items-center justify-between">
                <div>
                  <p className="text-text-primary font-rajdhani font-semibold">{team.leader_name}</p>
                  <p className="text-xs text-text-secondary font-mono">{team.leader_htp_id}</p>
                </div>
                <span className="text-xs bg-purple-primary/20 text-purple-primary px-2 py-1 rounded font-rajdhani">Leader</span>
              </div>

              {team.member_name ? (
                <div className="bg-dark-bg rounded-lg p-4 border border-purple-primary/10 flex items-center justify-between">
                  <div>
                    <p className="text-text-primary font-rajdhani font-semibold">{team.member_name}</p>
                    <p className="text-xs text-text-secondary font-mono">{team.member_htp_id}</p>
                  </div>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded font-rajdhani">Member</span>
                </div>
              ) : (
                <div className="bg-dark-bg rounded-lg p-4 border border-dashed border-purple-primary/20 text-center">
                  <p className="text-text-secondary font-rajdhani">Waiting for teammate to join...</p>
                </div>
              )}
            </div>

            {/* Leave/Delete */}
            <button
              onClick={handleLeave}
              disabled={submitting}
              className="w-full px-4 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg font-rajdhani font-semibold transition-all"
            >
              {isLeader ? 'Delete Team' : 'Leave Team'}
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
