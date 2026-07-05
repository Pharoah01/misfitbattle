/**
 * Main Application Component
 * Phase 2: UI Implementation
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts';
import { ProtectedRoute } from '@/components';
import { queryClient } from '@/config/queryClient';
import { Home, Login, Register, Dashboard, Profile, ChallengePage, CompleteProfile, EditProfile, Rules, Team, Lobby, Leaderboard, Practice } from '@/pages';
import { AdminPanel } from '@/pages/AdminPanel';
import { Practice } from '@/pages/Practice';
import { CompetitionTimer } from '@/components/CompetitionTimer';
import { Announcements } from '@/components/Announcements';
import { initializeSecurity } from '@/utils/security';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePresence } from '@/hooks/usePresence';
import './App.css';

/** Shows competition timer on all pages except public, lobby, and admin */
function TimerWrapper() {
  const { pathname } = useLocation();
  usePresence();
  const hidden = ['/', '/login', '/register', '/complete-profile', '/lobby', '/jaswanth', '/leaderboard'].includes(pathname);
  if (hidden) return null;
  return (
    <>
      <Announcements />
      <CompetitionTimer />
    </>
  );
}

function App() {
  useEffect(() => {
    initializeSecurity();
  }, []);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TimerWrapper />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireProfileCompletion={true}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Challenge route - slug-based */}
            <Route 
              path="/play/:slug" 
              element={
                <ProtectedRoute requireProfileCompletion={true}>
                  <ChallengePage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute requireProfileCompletion={false}>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/edit-profile" 
              element={
                <ProtectedRoute requireProfileCompletion={false}>
                  <EditProfile />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/rules" 
              element={
                <ProtectedRoute requireProfileCompletion={true}>
                  <Rules />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/team" 
              element={
                <ProtectedRoute requireProfileCompletion={true}>
                  <Team />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/lobby" 
              element={
                <ProtectedRoute requireProfileCompletion={true}>
                  <Lobby />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/leaderboard" 
              element={
                <ProtectedRoute requireProfileCompletion={true}>
                  <Leaderboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/practice" 
              element={
                <ProtectedRoute requireProfileCompletion={true}>
                  <Practice />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/practice" 
              element={
                <ProtectedRoute requireProfileCompletion={true}>
                  <Practice />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/jaswanth" 
              element={
                <ProtectedRoute requireProfileCompletion={false}>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
