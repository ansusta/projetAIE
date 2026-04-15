import React, { useState } from 'react';
import { Home, Target, User, Briefcase, Bell, Search, Menu, MapPin, Building, Clock, Euro, Sparkles, CheckCircle } from 'lucide-react';
import Logo from '../components/Logo';
import ProfileTab from './ProfileTab';

// --- MOCK DATA ---
// This simulates what your backend AI will eventually send to the frontend
const mockMatches = [
  {
    id: 1,
    title: "Développeur React Senior",
    company: "TechVision",
    location: "Paris, France",
    type: "CDI",
    workModel: "Télétravail partiel",
    salary: "55k€ - 70k€",
    matchScore: 95,
    matchReason: "Vos 4 années d'expérience en React et votre maîtrise de Tailwind CSS correspondent parfaitement aux exigences techniques de ce poste.",
    skills: ["React", "Tailwind", "TypeScript"],
    logo: "TV"
  },
  {
    id: 2,
    title: "Ingénieur Frontend (Vue/React)",
    company: "Innovatech Solutions",
    location: "Lyon, France",
    type: "CDI",
    workModel: "100% Télétravail",
    salary: "50k€ - 65k€",
    matchScore: 88,
    matchReason: "Votre profil correspond fortement. L'entreprise recherche une transition vers React, une compétence clé de votre CV.",
    skills: ["React", "Vue.js", "API REST"],
    logo: "IS"
  },
  {
    id: 3,
    title: "Développeur Fullstack JS",
    company: "StartUp Nation",
    location: "Bordeaux, France",
    type: "CDD (12 mois)",
    workModel: "Sur site",
    salary: "45k€ - 55k€",
    matchScore: 76,
    matchReason: "Bonne correspondance sur le frontend, mais nécessite une montée en compétence sur Node.js (exigé pour le poste).",
    skills: ["JavaScript", "Node.js", "React"],
    logo: "SN"
  }
];

export default function CandidateDashboard() {
  const [activeTab, setActiveTab] = useState('matches'); // Changed default tab to 'matches' to see it immediately!

  const navItems = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'matches', label: 'Mes Matchs', icon: Target },
    { id: 'applications', label: 'Candidatures', icon: Briefcase },
    { id: 'profile', label: 'Mon Profil', icon: User },
  ];

  // This function renders the specific content based on the selected tab
  const renderContent = () => {
    if (activeTab === 'matches') {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Emplois recommandés</h2>
              <p className="text-slate-500 mt-1">Basé sur l'analyse IA de votre profil et de vos compétences.</p>
            </div>
            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
              {mockMatches.length} offres
            </span>
          </div>

          {/* Matches Feed */}
          <div className="space-y-5">
            {mockMatches.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow group">
                
                {/* Card Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    {/* Fake Company Logo */}
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl font-bold text-slate-400">
                      {job.logo}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-600 font-medium mt-1">
                        <Building className="w-4 h-4 text-slate-400" />
                        {job.company}
                      </div>
                    </div>
                  </div>

                  {/* AI Match Badge */}
                  <div className="flex flex-col items-end">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                      job.matchScore >= 90 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700' : 
                      job.matchScore >= 80 ? 'bg-green-50 border-green-200 text-green-700' : 
                      'bg-orange-50 border-orange-200 text-orange-700'
                    }`}>
                      <Sparkles className="w-4 h-4" />
                      <span className="font-bold text-sm">Match {job.matchScore}%</span>
                    </div>
                  </div>
                </div>

                {/* Job Details Tags */}
                <div className="flex flex-wrap gap-3 mb-5">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <MapPin className="w-4 h-4 text-slate-400" /> {job.location}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <Clock className="w-4 h-4 text-slate-400" /> {job.type} • {job.workModel}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <Euro className="w-4 h-4 text-slate-400" /> {job.salary}
                  </div>
                </div>

                {/* AI Insight Box */}
                <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl p-4 mb-5 border border-blue-100/50">
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">Pourquoi c'est un match ?</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{job.matchReason}</p>
                    </div>
                  </div>
                </div>

                {/* Required Skills & Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex gap-2">
                    {job.skills.map((skill, index) => (
                      <span key={index} className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-3">
                    <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                      Ignorer
                    </button>
                    <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-sm shadow-blue-600/20">
                      <CheckCircle className="w-4 h-4" />
                      Postuler
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'profile') {
      return <ProfileTab />;
    }

    // Default placeholder for other tabs
    return (
      <div className="bg-white rounded-2xl border border-slate-200 border-dashed h-96 flex flex-col items-center justify-center text-slate-400 space-y-4 animate-fade-in">
        <Target className="w-12 h-12 text-slate-300" />
        <p className="text-lg font-medium text-slate-500">
          Contenu pour : {navItems.find(item => item.id === activeTab)?.label}
        </p>
        <p className="text-sm text-slate-400">Cette section est en cours de construction.</p>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* Sidebar (Desktop) */}
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
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Mini Profile */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-slate-50 rounded-xl transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
              JD
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-slate-900">Jean Dupont</span>
              <span className="text-xs text-slate-500">Candidat</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Top Header */}
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
            <div className="hidden lg:flex items-center relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              <input 
                type="text" 
                placeholder="Rechercher des offres..." 
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors w-64"
              />
            </div>
            
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-full border border-slate-200">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-4xl mx-auto">
            {renderContent()}
          </div>
        </div>

      </main>
    </div>
  );
}