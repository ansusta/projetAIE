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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"               element={<LandingPage />} />
        <Route path="/register"       element={<RegisterPage />} />
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/onboarding"     element={<OnboardingCV />} />
        <Route path="/dashboard"      element={<CandidateDashboard />} />
        <Route path="/edit-profile"   element={<EditProfilePage />} />
        <Route path="/edit-cv"        element={<EditCVPage />} />
        <Route path="/notifications"  element={<NotificationsPage />} />
        <Route path="/recruteur/:id"  element={<RecruteurProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;