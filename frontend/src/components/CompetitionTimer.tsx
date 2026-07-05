/**
 * Global Competition Timer
 * Sticky bar shown on all authenticated pages during an active competition.
 * Syncs with server time, shows warnings, triggers end overlay.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { toast } from '@/utils';

interface CompetitionStatus {
  is_active: boolean;
  start_time?: string;
  end_time?: string;
  server_time: string;
  team_name?: string | null;
  team_submissions_count?: number;
}

export const CompetitionTimer: React.FC = () => {
  const navigate = useNavigate();
  const [endTime, setEndTime] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [ended, setEnded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const offsetRef = useRef(0);
  const totalPausedRef = useRef(0);
  const warningsShown = useRef<Set<number>>(new Set());

  const WARNING_THRESHOLDS = [1800, 600, 300, 60]; // 30m, 10m, 5m, 1m

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/submissions/competition-status/');
      const data: CompetitionStatus = res.data;

      if (!data.end_time) {
        setVisible(false);
        return;
      }

      const serverNow = new Date(data.server_time).getTime();
      offsetRef.current = serverNow - Date.now();
      setEndTime(new Date(data.end_time).getTime());
      totalPausedRef.current = (data as any).total_paused_seconds || 0;
      setPaused((data as any).is_paused || false);
      setVisible(true);

      if (!data.is_active && !(data as any).is_paused) {
        // Competition ended
        setEnded(true);
      }
    } catch {
      setVisible(false);
    }
  }, []);

  // Poll server every 30 seconds
  useEffect(() => {
    fetchStatus();
    const poll = setInterval(fetchStatus, 30000);
    return () => clearInterval(poll);
  }, [fetchStatus]);

  // Load shown warnings from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('timer_warnings_shown');
      if (stored) warningsShown.current = new Set(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Tick every second
  useEffect(() => {
    if (!endTime) return;

    const tick = () => {
      if (paused) return; // Don't tick when paused
      
      const now = Date.now() + offsetRef.current;
      // Add paused duration to end time (extends it)
      const adjustedEnd = endTime + (totalPausedRef.current * 1000);
      const diff = Math.max(0, Math.floor((adjustedEnd - now) / 1000));
      setSecondsLeft(diff);

      if (diff <= 0 && !ended) {
        setEnded(true);
      }

      // Warnings
      for (const threshold of WARNING_THRESHOLDS) {
        if (diff <= threshold && diff > threshold - 2 && !warningsShown.current.has(threshold)) {
          warningsShown.current.add(threshold);
          sessionStorage.setItem('timer_warnings_shown', JSON.stringify([...warningsShown.current]));

          const label = threshold >= 60 ? `${Math.floor(threshold / 60)} minute${threshold > 60 ? 's' : ''}` : `${threshold} seconds`;
          toast.warning(`${label} remaining`);
        }
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime, ended, paused]);

  // Handle tab visibility change — recalc on focus
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && endTime) {
        const now = Date.now() + offsetRef.current;
        setSecondsLeft(Math.max(0, Math.floor((endTime - now) / 1000)));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [endTime]);

  if (!visible || secondsLeft === null) return null;

  // Format time
  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;

  let timeStr: string;
  if (h > 0) {
    timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  } else {
    timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // Color based on urgency
  let barColor = 'border-purple-primary/30 bg-dark-surface';
  let textColor = 'text-purple-primary';
  if (secondsLeft <= 60) {
    barColor = 'border-red-500/50 bg-red-500/5';
    textColor = 'text-red-400';
  } else if (secondsLeft <= 300) {
    barColor = 'border-yellow-500/50 bg-yellow-500/5';
    textColor = 'text-yellow-400';
  }

  // Paused overlay
  if (paused) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-[9990] bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-3 flex items-center justify-center gap-3">
          <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
          <span className="text-yellow-400 font-rajdhani font-semibold text-sm">Competition is currently paused. Please wait for further instructions.</span>
        </div>
        <div className="h-12"></div>
      </>
    );
  }

  // End overlay
  if (ended) {
    return (
      <div className="fixed inset-0 z-[9998] bg-dark-bg/95 flex flex-col items-center justify-center backdrop-blur-sm">
        <h1 className="text-5xl font-bold font-orbitron text-text-primary mb-4">TIME'S UP</h1>
        <p className="text-text-secondary font-rajdhani text-lg mb-8">Competition has ended. No more submissions.</p>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/leaderboard')}
            className="px-8 py-3 bg-gradient-to-r from-purple-primary to-purple-secondary text-white font-bold rounded-lg font-rajdhani shadow-lg shadow-purple-primary/30"
          >
            View Leaderboard
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-dark-surface border border-purple-primary/30 text-text-primary font-bold rounded-lg font-rajdhani"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-[9990] border-b ${barColor} px-4 py-2 flex items-center justify-center gap-4`}>
        <span className="text-text-secondary text-xs font-rajdhani uppercase tracking-wider">Time Remaining</span>
        <span className={`text-xl font-bold font-orbitron tracking-widest ${textColor}`}>
          {timeStr}
        </span>
      </div>
      {/* Spacer so page content isn't hidden behind fixed bar */}
      <div className="h-10"></div>
    </>
  );
};
