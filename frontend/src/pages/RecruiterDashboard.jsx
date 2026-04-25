import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Briefcase, Users, Settings, LogOut, 
  Bell, Plus, MapPin, Clock, ChevronRight, MoreVertical, Search, Filter, 
  User, Building, Lock, Camera
} from 'lucide-react';
import CreateJobModal from '../components/CreateJobModal';
import CandidateProfileModal from '../components/CandidateProfileModal'; 

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);

  const openCandidateProfile = (candidate) => {
    setSelectedCandidate(candidate);
    setIsCandidateModalOpen(true);
  };

  // --- Données de test (Mock data) ---
  const stats = [
    { title: "Offres actives", value: "4", increase: "+1 ce mois" },
    { title: "Candidatures reçues", value: "42", increase: "+12 cette semaine" },
    { title: "Entretiens prévus", value: "5", increase: "Pour cette semaine" }
  ];

  const jobs = [
    { id: 1, title: "Développeur Front-End React", location: "Alger (Hybride)", type: "CDI", applicants: 14, status: "Active", date: "12 Oct" },
    { id: 2, title: "Chef de Projet Digital", location: "Oran", type: "CDI", applicants: 8, status: "Active", date: "10 Oct" },
    { id: 3, title: "Designer UI/UX", location: "Télétravail", type: "Freelance", applicants: 20, status: "Fermée", date: "05 Oct" },
    { id: 4, title: "Développeur Backend Node.js", location: "Alger", type: "CDI", applicants: 5, status: "Active", date: "01 Oct" },
  ];

  const candidates = [
  { id: 1, name: "Amine Benali", role: "Développeur Front-End React", date: "Il y a 2h", status: "Nouveau", exp: "3 ans", email: "amine.b@email.com", phone: "06 12 34 56 78", bio: "Passionné par la création d'interfaces utilisateur fluides. Expérience avérée avec React.js et Tailwind CSS.", skills: ["React", "Tailwind", "TypeScript", "Redux"] },
  { id: 2, name: "Sarah Mansouri", role: "Chef de Projet Digital", date: "Hier", status: "En entretien", exp: "5 ans", email: "sarah.m@email.com", phone: "05 55 11 22 33", bio: "Experte en méthodologie Agile et Scrum. J'ai dirigé des équipes de 10 personnes sur des projets de refonte web complexes.", skills: ["Agile", "Scrum", "Jira", "Management"] },
  { id: 3, name: "Karim Yelles", role: "Développeur Front-End React", date: "Hier", status: "En attente", exp: "2 ans", email: "k.yelles@email.com", skills: ["Vue.js", "React", "JavaScript"] },
  { id: 4, name: "Lina Touati", role: "Designer UI/UX", date: "Il y a 3 jours", status: "Refusé", exp: "4 ans", email: "lina.design@email.com", skills: ["Figma", "Adobe XD", "Prototypage"] },
  { id: 5, name: "Yacine Merah", role: "Développeur Backend Node.js", date: "Il y a 4 jours", status: "Nouveau", exp: "1 an", email: "y.merah@email.com", skills: ["Node.js", "Express", "MongoDB"] },
];

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    navigate('/login');
  };

 // Nouvel état pour les notifications
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // 1. L'état commence vide
  const [notifications, setNotifications] = useState([]);

  // 2. Récupération des données au chargement du composant
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Remplacez cette URL par la vraie route de votre backend
        const response = await fetch('http://localhost:5000/api/notifications', {
          method: 'GET',
          headers: {
            // On récupère le token que vous avez stocké lors du login
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(data); // On injecte les vraies données dans l'état !
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des notifications:", error);
      }
    };

    fetchNotifications();
  }, []); // Le tableau vide [] signifie : exécuter une seule fois au lancement

  // 2. Fonction pour tout marquer comme lu
  const handleMarkAllAsRead = async () => {
    try {
      // 1. On prévient le backend de mettre à jour la base de données
      const response = await fetch('http://localhost:5000/api/notifications/mark-read', {
        method: 'PUT', // ou PATCH, selon ce que vous avez configuré côté Node.js/Backend
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // 2. Si le backend dit "OK", on met à jour le visuel
        setNotifications(notifications.map(notif => ({ ...notif, unread: false })));
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des notifications:", error);
    }
  };

  // 3. Fonction pour voir toutes les notifications
  const handleViewAllNotifications = () => {
    setIsNotificationsOpen(false); // On ferme le menu déroulant
    setActiveTab('notifications'); // On bascule sur la nouvelle vue !
  };
  // --- Vues (Tabs) ---

  const renderOverview = () => (
    <div className="animate-fade-in" >
      {/* Actions & Stats */}
      <div className="flex justify-between items-end mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100">
              <p className="text-sm font-medium text-slate-500 mb-2">{stat.title}</p>
              <h3 className="text-3xl font-black text-slate-800 mb-2">{stat.value}</h3>
              <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded-md">
                {stat.increase}
              </p>
            </div>
          ))}
        </div>
        
        <button 
          onClick={() => setIsJobModalOpen(true)}
          className="hidden lg:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all ml-6 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" /> Nouvelle offre
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Jobs Table (Aperçu) */}
        <div className="xl:col-span-2 bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Offres récentes</h3>
            {/* BOUTON VOIR TOUT - Change l'onglet */}
            <button 
              onClick={() => setActiveTab('jobs')}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Voir tout
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-sm border-b border-slate-100">
                  <th className="font-medium py-4 px-6">Poste</th>
                  <th className="font-medium py-4 px-6">Candidats</th>
                  <th className="font-medium py-4 px-6">Statut</th>
                </tr>
              </thead>
              <tbody>
                {jobs.slice(0, 3).map((job) => (
                  <tr key={job.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800 mb-1">{job.title}</p>
                      <div className="flex items-center text-xs text-slate-500 font-medium gap-3">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center justify-center bg-indigo-50 text-indigo-700 font-bold text-sm px-3 py-1 rounded-lg">
                        {job.applicants}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        job.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Candidates (Aperçu) */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Candidatures récentes</h3>
          </div>
          <div className="p-2 flex-1">
            {candidates.slice(0, 4).map((candidate) => (
              <div 
                key={candidate.id} 
                onClick={() => openCandidateProfile(candidate)}
                className="flex items-center p-4 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold mr-4 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  {candidate.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{candidate.name}</p>
                  <p className="text-xs text-slate-500 truncate mb-1">{candidate.role}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors ml-2" />
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100">
            <button 
              onClick={() => setActiveTab('candidates')}
              className="w-full py-3 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              Voir tous les candidats
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderJobs = () => (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Toutes mes offres</h2>
          <p className="text-slate-500 text-sm mt-1">Gérez vos annonces et suivez leur progression.</p>
        </div>
        <button 
          onClick={() => setIsJobModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold transition-all"
        >
          <Plus className="w-5 h-5" /> Créer une offre
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-sm border-b border-slate-100">
              <th className="font-medium py-4 px-6">Poste & Détails</th>
              <th className="font-medium py-4 px-6">Date de pub.</th>
              <th className="font-medium py-4 px-6 text-center">Candidats</th>
              <th className="font-medium py-4 px-6">Statut</th>
              <th className="font-medium py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                <td className="py-4 px-6">
                  <p className="font-bold text-slate-800 mb-1">{job.title}</p>
                  <div className="flex items-center text-xs text-slate-500 font-medium gap-3">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.type}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-slate-500">{job.date}</td>
                <td className="py-4 px-6 text-center">
                  <span className="inline-flex items-center justify-center bg-indigo-50 text-indigo-700 font-bold text-sm px-3 py-1 rounded-lg">
                    {job.applicants}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    job.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <button className="text-slate-400 hover:text-indigo-600 p-2">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCandidates = () => (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Base de candidats</h2>
          <p className="text-slate-500 text-sm mt-1">Gérez toutes les candidatures reçues.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((candidate) => (
          <div 
            key={candidate.id} 
            onClick={() => openCandidateProfile(candidate)}
            className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 hover:border-indigo-100 hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xl font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                {candidate.name.charAt(0)}
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                candidate.status === 'Nouveau' ? 'bg-blue-50 text-blue-600' :
                candidate.status === 'En entretien' ? 'bg-indigo-50 text-indigo-600' :
                candidate.status === 'En attente' ? 'bg-amber-50 text-amber-600' :
                'bg-red-50 text-red-600'
              }`}>
                {candidate.status}
              </span>
            </div>
            <h3 className="font-bold text-slate-800 text-lg">{candidate.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{candidate.role}</p>
            
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-400 font-medium flex flex-col gap-1">
                <span>Candidature : {candidate.date}</span>
                <span>Expérience : {candidate.exp}</span>
              </div>
              <button className="p-2 bg-slate-50 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="animate-fade-in space-y-8 max-w-4xl mx-auto pb-10">
      
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Paramètres du compte</h2>
        <p className="text-slate-500 text-sm mt-1">Gérez vos informations personnelles et les préférences de votre entreprise.</p>
      </div>

      {/* Section Profil */}
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-indigo-600" /> Profil Personnel
        </h3>
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar d'édition */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-3xl font-black shadow-inner">
                RH
              </div>
              <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <span className="text-xs font-medium text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors">Changer la photo</span>
          </div>

          {/* Formulaire Profil */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nom complet</label>
              <input type="text" defaultValue="John Doe" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Adresse Email</label>
              <input type="email" defaultValue="recrutement@entreprise.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Numéro de téléphone</label>
              <input type="tel" defaultValue="+213 555 00 00 00" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Poste occupé</label>
              <input type="text" defaultValue="Responsable RH" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Section Entreprise */}
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
          <Building className="w-5 h-5 text-indigo-600" /> Profil de l'entreprise
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nom de l'entreprise</label>
            <input type="text" defaultValue="Tech Innovators DZ" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Site Web</label>
            <input type="url" defaultValue="https://www.tech-innovators.dz" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Description courte</label>
            <textarea rows="3" defaultValue="Leader dans le développement de solutions web et mobiles innovantes en Algérie." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors resize-none"></textarea>
          </div>
        </div>
      </div>

      {/* Section Préférences & Bouton Sauvegarder */}
      <div className="flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1 bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 w-full">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-indigo-600" /> Notifications Emails
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">Nouvelle candidature reçue</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-indigo-600 cursor-pointer rounded" />
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">Rappels des entretiens</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-indigo-600 cursor-pointer rounded" />
            </label>
          </div>
        </div>

        <button className="w-full md:w-auto h-fit px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all whitespace-nowrap">
          Sauvegarder les modifications
        </button>
      </div>

    </div>
  );

  const renderNotifications = () => (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Historique des notifications</h2>
          <p className="text-slate-500 text-sm mt-1">Retrouvez toutes vos alertes et activités récentes.</p>
        </div>
        
        {/* Bouton pour tout marquer comme lu depuis la page */}
        {/* Nouveau bouton bien plus visible */}
        <button 
          onClick={handleMarkAllAsRead}
          className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-5 py-2.5 rounded-xl font-bold transition-all">
          Tout marquer comme lu
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            Vous n'avez aucune notification pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-6 flex items-start gap-4 transition-colors hover:bg-slate-50 ${notif.unread ? 'bg-indigo-50/30' : ''}`}
              >
                {/* Icône de la notification */}
                <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.unread ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                
                {/* Contenu */}
                <div className="flex-1">
                  <p className={`text-base ${notif.unread ? 'text-slate-800 font-bold' : 'text-slate-700 font-medium'}`}>
                    {notif.text}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">{notif.time}</p>
                </div>

                {/* Point indicateur non-lu */}
                {notif.unread && (
                  <div className="shrink-0 w-3 h-3 bg-indigo-600 rounded-full mt-2 shadow-sm"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20">
        <div className="h-20 flex items-center px-8 border-b border-slate-100 cursor-pointer" onClick={() => navigate('/')}>
          <h1 className="text-2xl font-black text-indigo-600 tracking-tight">MatchTalent.</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 mt-2">Menu Principal</p>
          
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'overview' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" /> Vue d'ensemble
          </button>
          
          <button 
            onClick={() => setActiveTab('jobs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'jobs' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-5 h-5" /> Mes Offres
          </button>
          
          <button 
            onClick={() => setActiveTab('candidates')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'candidates' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-5 h-5" /> Candidats
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-2">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-5 h-5" /> Paramètres
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'overview' ? 'Bonjour, Recruteur 👋' : 
               activeTab === 'jobs' ? 'Gestion des annonces' : 
               activeTab === 'candidates' ? 'Suivi des candidatures' :
               activeTab === 'notifications' ? 'Vos notifications' :
               'Paramètres'}
            </h2>
          </div>
          
          {/* Zone Notifications & Profil MODIFIÉE ICI */}
          <div className="flex items-center gap-6">
            
            {/* Conteneur relatif pour le menu déroulant */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative p-2 transition-colors rounded-full ${isNotificationsOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'}`}
              >
                <Bell className="w-6 h-6" />
                {/* Point rouge seulement s'il y a des non-lues */}
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                )}
              </button>

              {/* Menu déroulant des notifications */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 z-50 animate-fade-in overflow-hidden">
                  
                  {/* En-tête du menu */}
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Notifications</h3>
                    <button onClick={handleMarkAllAsRead} 
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
                              Tout marquer comme lu
                    </button>
                  </div>
                  
                  {/* Liste défilante */}
                  <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors flex flex-col gap-1 ${notif.unread ? 'bg-indigo-50/30' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Petit point bleu pour les non-lues */}
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.unread ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
                          <div>
                            <p className={`text-sm ${notif.unread ? 'text-slate-800 font-semibold' : 'text-slate-600 font-medium'}`}>
                              {notif.text}
                            </p>
                            <span className="text-xs text-slate-400 font-medium mt-1 inline-block">{notif.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Footer du menu */}
                  <div 
  onClick={handleViewAllNotifications}
  className="p-3 text-center border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
>
  <span className="text-sm text-indigo-600 font-bold">Voir toutes les notifications</span>
</div>
                </div>
              )}
            </div>

            {/* Avatar Profil */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                RH
              </div>
            </div>
            
          </div>
        </header>

        {/* Contenu Défilant basé sur activeTab */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'jobs' && renderJobs()}
          {activeTab === 'candidates' && renderCandidates()}
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'notifications' && renderNotifications()} {}
        </div>

      </main>

      {/* Modales (Toujours en dehors du main) */}
      <CreateJobModal 
        isOpen={isJobModalOpen} 
        onClose={() => setIsJobModalOpen(false)} 
      />

      <CandidateProfileModal 
        isOpen={isCandidateModalOpen} 
        onClose={() => setIsCandidateModalOpen(false)}
        candidate={selectedCandidate}
      />

    </div>

    
  );
}