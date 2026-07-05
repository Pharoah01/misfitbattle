/**
 * Presence hook — sends heartbeat to backend with current page.
 * Called in App or ProtectedRoute to track user activity.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '@/api/client';
import { getAccessToken } from '@/api/client';

const PAGE_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/team': 'Team Dashboard',
  '/leaderboard': 'Leaderboard',
  '/profile': 'Profile',
  '/practice': 'Practice Mode',
  '/lobby': 'Lobby',
  '/rules': 'Rules',
};

function getPageName(pathname: string): string {
  if (pathname.startsWith('/play/')) {
    const slug = pathname.replace('/play/', '');
    return `Editing ${slug}`;
  }
  return PAGE_MAP[pathname] || pathname;
}

export function usePresence() {
  const { pathname } = useLocation();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const sendHeartbeat = () => {
      const page = getPageName(pathname);
      apiClient.post('/api/auth/heartbeat/', { page }).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [pathname]);
}
