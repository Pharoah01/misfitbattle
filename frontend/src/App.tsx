/**
 * Main Application Component
 * Phase 2: UI Implementation
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts';
import { ProtectedRoute } from '@/components';
import { queryClient } from '@/config/queryClient';
import { Home, Login, Register, Dashboard, Profile, ChallengePage, CompleteProfile, EditProfile, Rules, Team, Lobby } from '@/pages';
import { AdminPanel } from '@/pages/AdminPanel';
import { initializeSecurity } from '@/utils/security';
import { useEffect } from 'react';
import './App.css';

function App() {
  useEffect(() => {
    initializeSecurity();
  }, []);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
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
