/**
 * Main Application Component
 * Phase 2: UI Implementation
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts';
import { ProtectedRoute } from '@/components';
import { queryClient } from '@/config/queryClient';
import { Home, Login, Register, Dashboard, Profile, ChallengePage, CompleteProfile, EditProfile } from '@/pages';
import './App.css';

function App() {
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
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/play/:slug" 
              element={
                <ProtectedRoute>
                  <ChallengePage />
                </ProtectedRoute>
              } 
            />
            
            {/* Legacy route redirect */}
            <Route 
              path="/challenge/:id" 
              element={<Navigate to="/dashboard" replace />} 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/edit-profile" 
              element={
                <ProtectedRoute>
                  <EditProfile />
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
