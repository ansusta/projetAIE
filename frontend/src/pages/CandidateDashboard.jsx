import React, { useState, useEffect } from 'react';
import { Home, Target, User, Briefcase, Bell, Search, Menu, MapPin, Building, Clock, Euro, Sparkles, CheckCircle, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service'; // Import your auth service
import Logo from '../components/Logo';
import ProfileTab from './ProfileTab';

// --- MOCK DATA FOR JOBS ---
const mockMatches = [
  {
    id: 1, title: "Développeur React Senior", company: "TechVision", location: "Paris, France", type: "CDI", workModel: "Télétravail partiel", salary: "55k€ - 70k€", matchScore: 95,
    matchReason: "Vos 4 années d'expérience en React et votre maîtrise de Tailwind CSS correspondent parfaitement aux exigences techniques de ce poste.", skills: ["React", "Tailwind", "TypeScript"], logo: "TV"
  }
  // ... (Keep the rest of your mock matches here)
];

// Helper to format image URLs properly (change localhost:5000 to your backend URL if different)
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path}`;
};

export default function CandidateDashboard() {
  const [activeTab, setActiveTab] = useState('matches');
  const navigate = useNavigate();

  // 1. Turned currentUser into state so it can update dynamically
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')) || {});

  // 2. Fetch the LATEST data from the backend when the dashboard loads
  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        // Ensure you added getMe() to auth.service.js!
        if (authService.getMe) {
          const data = await authService.getMe();
          const userData = data.user || data; // Adjust based on your backend response
          setCurrentUser(userData);
          localStorage.setItem('user', JSON.stringify(userData)); // Update local storage
        }
      } catch (error) {
        console.error("Impossible de récupérer le profil à jour", error);
      }
    };

    fetchLatestProfile();
  }, []);

  const navItems = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'matches', label: 'Mes Matchs', icon: Target },
    { id: 'applications', label: 'Candidatures', icon: Briefcase },
    { id: 'profile', label: 'Mon Profil', icon: User },
  ];

  // 3. Bulletproof Logout handler
  const handleLogout = async () => {
    try {
      // Force clear local storage immediately so you are definitely logged out locally
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Try to call the backend service (if it throws 404, we catch it below)
      if (authService.logout) {
        await authService.logout(); 
      }
    } catch (error) {
      console.log("Erreur silencieuse ignorée (ex: 404). Déconnexion locale réussie.");
    } finally {
      // ALWAYS navigate back to home, even if backend request failed
      navigate('/'); 
    }
  };

  const renderContent = () => {
    if (activeTab === 'matches') {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Emplois recommandés</h2>
              <p className="text-slate-500 mt-1">Basé sur l'analyse IA de votre profil et de vos compétences.</p>
            </div>
          </div>
          
          <div className="space-y-5">
            {mockMatches.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl font-bold text-slate-400">
                      {job.logo}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                      <div className="flex items-center gap-2 text-slate-600 font-medium mt-1">
                        <Building className="w-4 h-4 text-slate-400" /> {job.company}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'profile') {
      return <ProfileTab user={currentUser} />;
    }

    return (
      <div className="bg-white rounded-2xl border border-slate-200 border-dashed h-96 flex flex-col items-center justify-center text-slate-400 space-y-4 animate-fade-in">
        <Target className="w-12 h-12 text-slate-300" />
        <p className="text-lg font-medium text-slate-500">
          Contenu pour : {navItems.find(item => item.id === activeTab)?.label}
        </p>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 z-10">
        <div className="p-6 border-b border-slate-100">
          <Logo />
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* 4. REAL User Mini Profile Update */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-slate-50 rounded-xl transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md overflow-hidden shrink-0">
              {currentUser.photoProfil ? (
                <img 
                  src={getImageUrl(currentUser.photoProfil)} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                currentUser.prenom ? currentUser.prenom[0].toUpperCase() : 'U'
              )}
            </div>
            <div className="flex flex-col text-left truncate w-full">
              <span className="text-sm font-bold text-slate-900 truncate capitalize">
                {currentUser.prenom || 'Prénom'} {currentUser.nom || ''}
              </span>
              <span className="text-xs text-slate-500 truncate">
                {currentUser.titreProf || 'Candidat'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-500 hover:text-slate-900">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-800 hidden sm:block">
              {navItems.find(item => item.id === activeTab)?.label}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="hidden lg:flex items-center relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              <input 
                type="text" 
                placeholder="Rechercher des offres..." 
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 w-64"
              />
            </div>
            
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-full border border-slate-200">
              <Bell className="w-5 h-5" />
            </button>

            {/* SETTINGS (Edit Profile) & LOGOUT BUTTONS */}
            <div className="h-6 w-px bg-slate-200 mx-2"></div> {/* Divider */}
            
            <button 
              onClick={() => navigate('/edit-profile')}
              title="Modifier mon profil"
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-full border border-transparent hover:border-blue-100"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button 
              onClick={handleLogout}
              title="Se déconnecter"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-full border border-transparent hover:border-red-100"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-4xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}