import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import CandidateDashboard from './pages/CandidateDashboard';
import OnboardingCV from './pages/OnboardingCV'; // N'oubliez pas l'import !

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* La nouvelle étape entre l'inscription et le dashboard */}
        <Route path="/onboarding" element={<OnboardingCV />} />
        
        <Route path="/dashboard" element={<CandidateDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;