/**
 * Competition Lobby — Waiting room before competition starts.
 * Shows countdown, team status, and redirects when timer hits 0.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';

interface CompetitionStatus {
  is_active: boolean;
  message: string | null;
  server_time: string;
  start_time?: string;
  end_time?: string;
  team_submissions_count?: number;
  team_name?: string | null;
}

interface TeamData {
  id: number;
  name: string;
  invite_code: string;
  is_full: boolean;
  leader_name: string;
  leader_htp_id: string;
  member_name: string | null;
  member_htp_id: string | null;
}

export const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<CompetitionStatus | null>(null);
  const [team, setTeam] = useState<TeamData | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [seconds, setSeconds] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const serverOffsetRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const [statusRes, teamRes] = await Promise.all([
        apiClient.get('/api/submissions/competition-status/'),
        apiClient.get('/api/teams/my-team/'),
      ]);
      setStatus(statusRes.data);
      setTeam(teamRes.data.team);

      // Calculate server time offset
      const serverTime = new Date(statusRes.data.server_time).getTime();
      const clientTime = Date.now();
      serverOffsetRef.current = serverTime - clientTime;

      // If competition is already active, redirect
      if (statusRes.data.is_active) {
        navigate('/dashboard', { replace: true });
        return;
      }
    } catch {
      // If no competition configured, go to dashboard
      navigate('/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Poll status every 10 seconds
  useEffect(() => {
    fetchStatus();
    const poll = setInterval(fetchStatus, 10000);
    return () => clearInterval(poll);
  }, [fetchStatus]);

  // Countdown ticker — every second
  useEffect(() => {
    if (!status?.start_time) return;

    const tick = () => {
      const now = Date.now() + serverOffsetRef.current;
      const start = new Date(status.start_time!).getTime();
      const diff = Math.max(0, start - now);
      setSeconds(Math.floor(diff / 1000));

      if (diff <= 0) {
        navigate('/dashboard', { replace: true });
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status?.start_time, navigate]);

  // Format seconds to HH:MM:SS
  useEffect(() => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    parts.push(`${String(m).padStart(2, '0')}m`);
    parts.push(`${String(s).padStart(2, '0')}s`);
    setTimeLeft(parts.join(' '));
  }, [seconds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-primary"></div>
      </div>
    );
  }

  // No team — send to team page
  if (!team) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl font-bold text-text-primary font-orbitron mb-4">
          <span className="text-purple-primary">JOIN</span> A TEAM
        </h1>
        <p className="text-text-secondary font-rajdhani mb-6 text-center">
          You need to be in a team before the competition starts.
        </p>
        <button
          onClick={() => navigate('/team')}
          className="px-6 py-3 bg-gradient-to-r from-purple-primary to-purple-secondary text-white font-bold rounded-lg font-rajdhani shadow-lg shadow-purple-primary/30"
        >
          Go to Team Page
        </button>
      </div>
    );
  }

  const isLeader = user?.htp_id === team.leader_htp_id;
  const myName = isLeader ? team.leader_name : team.member_name;
  const teammateName = isLeader ? team.member_name : team.leader_name;

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center px-4">
      {/* Title */}
      <h1 className="text-4xl font-bold text-text-primary font-orbitron mb-2 tracking-wider">
        <span className="text-purple-primary">MISFITS</span>-BATTLE
      </h1>
      <p className="text-text-secondary font-rajdhani text-lg mb-12">Competition Lobby</p>

      {/* Countdown */}
      <div className="bg-dark-surface border border-purple-primary/20 rounded-xl p-10 mb-8 text-center shadow-xl shadow-purple-primary/10">
        <p className="text-xs text-text-secondary uppercase tracking-widest font-rajdhani mb-3">Starts in</p>
        <div className="text-6xl font-bold font-orbitron text-purple-primary tracking-wider">
          {timeLeft || '--:--'}
        </div>
      </div>

      {/* Team Card */}
      <div className="bg-dark-surface border border-purple-primary/10 rounded-lg p-6 w-full max-w-sm mb-6">
        <h3 className="text-center text-lg font-bold text-text-primary font-orbitron mb-4">{team.name}</h3>

        <div className="space-y-3">
          {/* You */}
          <div className="flex items-center justify-between bg-dark-bg rounded-lg p-3 border border-purple-primary/10">
            <div>
              <p className="text-text-primary font-rajdhani font-semibold text-sm">{myName}</p>
              <p className="text-text-secondary text-xs font-mono">{user?.htp_id}</p>
            </div>
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" title="You're here"></span>
          </div>

          {/* Teammate */}
          {team.is_full ? (
            <div className="flex items-center justify-between bg-dark-bg rounded-lg p-3 border border-purple-primary/10">
              <div>
                <p className="text-text-primary font-rajdhani font-semibold text-sm">{teammateName}</p>
                <p className="text-text-secondary text-xs font-mono">
                  {isLeader ? team.member_htp_id : team.leader_htp_id}
                </p>
              </div>
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" title="Teammate"></span>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-dark-bg rounded-lg p-3 border border-dashed border-yellow-500/30">
              <p className="text-yellow-400 font-rajdhani text-sm">Teammate not joined</p>
              <span className="text-xs text-text-secondary font-rajdhani">Proceed alone</span>
            </div>
          )}
        </div>
      </div>

      {/* Status text */}
      <p className="text-text-secondary text-sm font-rajdhani text-center max-w-xs">
        You'll be automatically redirected when the competition begins.
      </p>
    </div>
  );
};
