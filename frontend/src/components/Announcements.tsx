/**
 * Global Announcements Component
 * Polls for announcements, shows toasts for new ones, pinned banner.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '@/api/client';
import { toast } from '@/utils';

interface AnnouncementData {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  is_pinned: boolean;
  is_read: boolean;
  created_by: string;
  created_at: string;
  expires_at: string | null;
}

interface Props {
  onUnreadCount?: (count: number) => void;
}

export const Announcements: React.FC<Props> = ({ onUnreadCount }) => {
  const [pinned, setPinned] = useState<AnnouncementData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [alertModal, setAlertModal] = useState<AnnouncementData | null>(null);
  const seenIds = useRef<Set<number>>(new Set());

  // Load seen IDs from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('ann_seen');
      if (stored) seenIds.current = new Set(JSON.parse(stored));
    } catch {}
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/announcements/');
      const { announcements, unread_count, pinned: pinnedAnn } = res.data;

      onUnreadCount?.(unread_count);
      setPinned(pinnedAnn && !dismissed ? pinnedAnn : null);

      // Show notifications for new unread announcements
      for (const ann of announcements) {
        if (!ann.is_read && !seenIds.current.has(ann.id)) {
          seenIds.current.add(ann.id);
          sessionStorage.setItem('ann_seen', JSON.stringify([...seenIds.current]));
          
          // Urgent → Alert modal popup
          if (ann.type === 'urgent') {
            setAlertModal(ann);
            // Play sound
            try { new Audio('data:audio/wav;base64,UklGRl9vT19teleWQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQ==').play(); } catch {}
          } else {
            // Others → Toast
            const method = ann.type === 'warning' ? 'warning' : ann.type === 'success' ? 'success' : 'info';
            toast[method](`${ann.title}: ${ann.message}`);
          }
        }
      }
    } catch {}
  }, [onUnreadCount, dismissed]);

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 10000);
    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  const handleDismiss = async () => {
    setDismissed(true);
    setPinned(null);
    if (pinned) {
      try { await apiClient.post('/api/announcements/mark-read/', { announcement_id: pinned.id }); } catch {}
    }
  };

  const colors = {
    info: 'bg-purple-primary/10 border-purple-primary/30 text-purple-primary',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    urgent: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  const handleAlertDismiss = async () => {
    if (alertModal) {
      await apiClient.post('/api/announcements/mark-read/', { announcement_id: alertModal.id }).catch(() => {});
    }
    setAlertModal(null);
  };

  return (
    <>
      {/* Alert Modal — blocks screen until dismissed */}
      {alertModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-dark-bg/90 backdrop-blur-sm">
          <div className="bg-dark-surface border border-purple-primary/20 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-text-primary font-orbitron">{alertModal.title}</h2>
              <button onClick={handleAlertDismiss} className="text-text-secondary hover:text-text-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-text-secondary font-rajdhani mb-6">{alertModal.message}</p>
            <button
              onClick={handleAlertDismiss}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-primary to-purple-secondary text-white font-bold rounded-lg font-rajdhani"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Pinned Banner */}
      {pinned && (
        <div className={`fixed top-0 left-0 right-0 z-[9985] border-b px-4 py-3 flex items-center justify-center gap-4 ${colors[pinned.type]}`}>
          <div className="flex items-center gap-2 text-sm font-rajdhani">
            <span className="font-bold">{pinned.title}</span>
            <span className="opacity-80">{pinned.message}</span>
          </div>
          <button onClick={handleDismiss} className="text-xs opacity-60 hover:opacity-100 transition-opacity px-2 py-1">
            Dismiss
          </button>
        </div>
      )}
    </>
  );
};
