// frontend/src/components/Navbar.jsx
import React from 'react';
import { LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

export default function Navbar() {
  const navigate = useNavigate();
  
  // Get current user info (optional, just to show their name)
  const user = JSON.parse(localStorage.getItem('user')) || {};

  const handleLogout = async () => {
    await authService.logout();
    navigate('/'); // Redirect to home or login page after logout
  };

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
        <h1 className="text-2xl font-black text-blue-600 tracking-tight">MatchTalent.</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-semibold text-slate-800">{user.prenom || user.nomEntreprise || 'Utilisateur'}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
        
        <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
          <button 
            onClick={() => navigate('/edit-profile')}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
            title="Modifier le profil"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </nav>
  );
}