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
  const seenIds = useRef<Set<number>>(new Set());

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/announcements/');
      const { announcements, unread_count, pinned: pinnedAnn } = res.data;

      onUnreadCount?.(unread_count);
      setPinned(pinnedAnn && !dismissed ? pinnedAnn : null);

      // Show toast for new unread announcements
      for (const ann of announcements) {
        if (!ann.is_read && !seenIds.current.has(ann.id)) {
          seenIds.current.add(ann.id);
          const method = ann.type === 'urgent' ? 'error' : 
                         ann.type === 'warning' ? 'warning' : 
                         ann.type === 'success' ? 'success' : 'info';
          toast[method](`${ann.title}: ${ann.message}`);
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

  if (!pinned) return null;

  const colors = {
    info: 'bg-purple-primary/10 border-purple-primary/30 text-purple-primary',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    urgent: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-[9985] border-b px-4 py-3 flex items-center justify-center gap-4 ${colors[pinned.type]}`}>
      <div className="flex items-center gap-2 text-sm font-rajdhani">
        <span className="font-bold">{pinned.title}</span>
        <span className="opacity-80">{pinned.message}</span>
      </div>
      <button onClick={handleDismiss} className="text-xs opacity-60 hover:opacity-100 transition-opacity px-2 py-1">
        Dismiss
      </button>
    </div>
  );
};
