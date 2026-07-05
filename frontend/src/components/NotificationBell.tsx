/**
 * Notification Bell — shows unread count + dropdown of notifications.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { toast } from '@/utils';

interface NotifItem {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const seenIds = useRef<Set<number>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const fetch = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/notifications/');
      setNotifications(res.data.notifications);
      setUnread(res.data.unread_count);

      // Toast for new unread
      for (const n of res.data.notifications) {
        if (!n.is_read && !seenIds.current.has(n.id)) {
          seenIds.current.add(n.id);
          toast.info(`${n.title}${n.message ? ': ' + n.message : ''}`);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, [fetch]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await apiClient.post('/api/notifications/mark-read/', {});
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleClick = (n: NotifItem) => {
    apiClient.post('/api/notifications/mark-read/', { id: n.id });
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 hover:bg-dark-surface rounded transition-colors">
        <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-dark-surface border border-purple-primary/20 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-purple-primary/10">
            <span className="text-sm font-rajdhani font-semibold text-text-primary">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-purple-primary font-rajdhani hover:underline">Mark all read</button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-text-secondary text-sm font-rajdhani">No notifications</p>
            ) : (
              notifications.slice(0, 10).map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-dark-border/30 hover:bg-purple-primary/5 transition-colors ${!n.is_read ? 'bg-purple-primary/5' : ''}`}
                >
                  <p className={`text-sm font-rajdhani ${!n.is_read ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>{n.title}</p>
                  {n.message && <p className="text-xs text-text-secondary font-rajdhani mt-0.5">{n.message}</p>}
                  <p className="text-xs text-text-secondary font-mono mt-1">{new Date(n.created_at).toLocaleTimeString()}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
