import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage            from './pages/LandingPage';
import RegisterPage           from './pages/RegisterPage';
import LoginPage              from './pages/LoginPage';
import CandidateDashboard     from './pages/CandidateDashboard';
import OnboardingCV           from './pages/OnboardingCV';
import EditProfilePage        from './pages/EditProfilePage';
import EditCVPage             from './pages/EditCVPage';
import NotificationsPage      from './pages/NotificationsPage';
import RecruteurProfilePage   from './pages/RecruteurProfilePage';
import RecruiterDashboard     from './pages/RecruiterDashboard';
import AdminDashboard         from './pages/AdminDashboard';
import PublicProfile          from './pages/PublicProfile';
import VerificationPage       from './pages/unverifiedRecruteur';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public & Auth Routes */}
        <Route path="/"               element={<LandingPage />} />
        <Route path="/register"       element={<RegisterPage />} />
        <Route path="/login"          element={<LoginPage />} />
        
        {/* Candidate Routes */}
        <Route path="/onboarding"     element={<OnboardingCV />} />
        <Route path="/dashboard"      element={<CandidateDashboard />} />
        <Route path="/edit-profile"   element={<EditProfilePage />} />
        <Route path="/edit-cv"        element={<EditCVPage />} />
        
        {/* Recruiter Routes */}
        <Route path="/recruiter-dashboard" element={<RecruiterDashboard />} />
        <Route path="/unverifiedRecruteur" element={<VerificationPage />} />
        <Route path="/recruteur/:id"       element={<RecruteurProfilePage />} />
        
        {/* Admin Routes */}
        {/* Changed this to match the Login redirection exactly */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        
        {/* Shared / General Routes */}
        <Route path="/notifications"  element={<NotificationsPage />} />
        <Route path="/user/:id"       element={<PublicProfile />} />

        {/* 404 Catch-All Route */}
        <Route path="*" element={
          <div className="flex items-center justify-center h-screen text-xl font-bold text-slate-600">
            404 - Page Introuvable
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;