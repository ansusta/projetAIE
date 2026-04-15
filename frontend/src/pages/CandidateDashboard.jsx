import React, { useState, useEffect, useCallback } from 'react';
import {
  Home, Target, User, Briefcase, Bell, Search,
  Menu, MapPin, Building, Clock, Euro, Sparkles,
  Settings, LogOut, ChevronRight, Loader2, RefreshCw,
  CheckCircle, XCircle, AlertCircle, Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { matchService } from '../services/match.service';
import { candidatureService } from '../services/candidature.service';
import { notificationService } from '../services/notification.service';
import { offreService } from '../services/offre.service';
import Logo from '../components/Logo';
import ProfileTab from './ProfileTab';

// ── Helpers ─────────────────────────────────────────────────────────────────
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${path}`;
};

const CONTRACT_COLORS = {
  CDI:       'bg-green-50 text-green-700 border-green-100',
  CDD:       'bg-amber-50 text-amber-700 border-amber-100',
  stage:     'bg-blue-50 text-blue-700 border-blue-100',
  freelance: 'bg-purple-50 text-purple-700 border-purple-100',
};

const STATUS_MAP = {
  Recue:                { label: 'Reçue',        color: 'bg-slate-100 text-slate-600',   icon: AlertCircle },
  demandeDocSupp:       { label: 'Docs demandés', color: 'bg-amber-50 text-amber-700',   icon: AlertCircle },
  convocationEntretien: { label: 'Entretien',     color: 'bg-blue-50 text-blue-700',      icon: Calendar   },
  Embauchee:            { label: 'Acceptée 🎉',   color: 'bg-green-50 text-green-700',    icon: CheckCircle },
  refusee:              { label: 'Refusée',        color: 'bg-red-50 text-red-600',        icon: XCircle    },
};

// ── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const color =
    score >= 80 ? 'text-green-600' :
    score >= 60 ? 'text-amber-500' : 'text-red-500';
  return (
    <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-full border-4 ${
      score >= 80 ? 'border-green-200' : score >= 60 ? 'border-amber-200' : 'border-red-200'
    } shrink-0`}>
      <span className={`text-lg font-black ${color}`}>{score}%</span>
      <span className="text-[9px] text-slate-400 font-semibold">MATCH</span>
    </div>
  );
}

// ── Match card ───────────────────────────────────────────────────────────────
function MatchCard({ match, onApply, applying }) {
  const { offre, matchScore } = match;
  const recruteur = offre.idRecruteur || {};

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl font-bold text-slate-400 shrink-0">
          {recruteur.nomEntreprise?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 truncate">{offre.titre}</h3>
          <div className="flex items-center gap-2 text-slate-500 text-sm mt-0.5">
            <Building className="w-4 h-4 shrink-0" />
            <span className="truncate">{recruteur.nomEntreprise || 'Entreprise'}</span>
          </div>
        </div>
        <ScoreRing score={matchScore} />
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {offre.typeContrat && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${CONTRACT_COLORS[offre.typeContrat] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
            {offre.typeContrat}
          </span>
        )}
        {offre.localisation && (
          <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            <MapPin className="w-3 h-3" /> {offre.localisation}
          </span>
        )}
        {(offre.salaireMin || offre.salaireMax) && (
          <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
            <Euro className="w-3 h-3" />
            {offre.salaireMin && offre.salaireMax
              ? `${offre.salaireMin.toLocaleString()} – ${offre.salaireMax.toLocaleString()}`
              : offre.salaireMin
              ? `Dès ${offre.salaireMin.toLocaleString()}`
              : `Jusqu'à ${offre.salaireMax.toLocaleString()}`}
          </span>
        )}
      </div>

      {offre.description && (
        <p className="text-sm text-slate-500 mb-5 line-clamp-2">{offre.description}</p>
      )}

      <button
        onClick={() => onApply(offre._id)}
        disabled={applying}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 transition-all"
      >
        {applying ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Candidature en cours…</>
        ) : (
          <><Sparkles className="w-4 h-4" /> Postuler avec ce match</>
        )}
      </button>
    </div>
  );
}

// ── Main dashboard ───────────────────────────────────────────────────────────
export default function CandidateDashboard() {
  const navigate    = useNavigate();
  const [activeTab, setActiveTab] = useState('matches');

  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem('user')) || {}
  );

  // Matches state
  const [matchData, setMatchData]       = useState(null);  // { offre, matchScore }
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError]     = useState('');
  const [applying, setApplying]         = useState(false);
  const [applyMsg, setApplyMsg]         = useState('');

  // Applications state
  const [candidatures, setCandidatures]     = useState([]);
  const [candsLoading, setCandsLoading]     = useState(false);

  // Notifications state
  const [notifications, setNotifications]         = useState([]);
  const [unreadCount, setUnreadCount]             = useState(0);
  const [notifOpen, setNotifOpen]                 = useState(false);

  // Jobs browse state
  const [offres, setOffres]         = useState([]);
  const [offresLoading, setOffresLoading] = useState(false);
  const [search, setSearch]         = useState('');

  // ── Fetch latest profile ──────────────────────────────────────────────────
  useEffect(() => {
    authService.getMe()
      .then((data) => {
        const user = data.user || data;
        setCurrentUser(user);
        localStorage.setItem('user', JSON.stringify(user));
      })
      .catch(() => {});
  }, []);

  // ── Fetch notifications ───────────────────────────────────────────────────
  useEffect(() => {
    notificationService.getAll()
      .then((data) => {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.lu).length);
      })
      .catch(() => {});
  }, []);

  // ── Fetch data when tab changes ───────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'matches' && !matchData && !matchLoading) {
      loadMatch();
    }
    if (activeTab === 'applications' && candidatures.length === 0 && !candsLoading) {
      loadCandidatures();
    }
    if (activeTab === 'home' && offres.length === 0 && !offresLoading) {
      loadOffres();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadMatch = useCallback(async () => {
    setMatchLoading(true);
    setMatchError('');
    setMatchData(null);
    setApplyMsg('');
    try {
      const data = await matchService.getRecommandations();
      setMatchData(data.match); // null if no match available
    } catch (err) {
      setMatchError(err.response?.data?.error || 'Impossible de charger la recommandation.');
    } finally {
      setMatchLoading(false);
    }
  }, []);

  const loadCandidatures = useCallback(async () => {
    setCandsLoading(true);
    try {
      const data = await candidatureService.mesCandidatures();
      setCandidatures(data);
    } catch {
      // silent
    } finally {
      setCandsLoading(false);
    }
  }, []);

  const loadOffres = useCallback(async (q = '') => {
    setOffresLoading(true);
    try {
      const data = await offreService.lister({ search: q, limit: 20 });
      setOffres(data.offres || []);
    } catch {
      // silent
    } finally {
      setOffresLoading(false);
    }
  }, []);

  const handleApply = async (offreId) => {
    setApplying(true);
    setApplyMsg('');
    try {
      const res = await matchService.apply(offreId);
      setApplyMsg(`✅ Candidature envoyée ! Score : ${res.matchScore}%`);
      setMatchData(null); // clear so next recommendation loads
    } catch (err) {
      setApplyMsg(`❌ ${err.response?.data?.error || 'Erreur lors de la candidature.'}`);
    } finally {
      setApplying(false);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
    setUnreadCount(0);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    authService.logout?.();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadOffres(search);
  };

  // ── Nav items ─────────────────────────────────────────────────────────────
  const navItems = [
    { id: 'home',         label: 'Offres',        icon: Home },
    { id: 'matches',      label: 'Mon Match IA',  icon: Target },
    { id: 'applications', label: 'Candidatures',  icon: Briefcase },
    { id: 'profile',      label: 'Mon Profil',    icon: User },
  ];

  // ── Content renderer ──────────────────────────────────────────────────────
  const renderContent = () => {

    // ── HOME : browse open jobs ──────────────────────────────────────────────
    if (activeTab === 'home') {
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Offres d'emploi</h2>
              <p className="text-slate-500 mt-1">Toutes les offres actuellement ouvertes</p>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Titre du poste…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 w-full sm:w-56"
                />
              </div>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">
                Rechercher
              </button>
            </form>
          </div>

          {offresLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : offres.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 h-48 flex items-center justify-center text-slate-400">
              Aucune offre trouvée.
            </div>
          ) : (
            <div className="space-y-4">
              {offres.map((offre) => (
                <div key={offre._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-400 shrink-0">
                      {offre.idRecruteur?.nomEntreprise?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{offre.titre}</h3>
                      <p className="text-sm text-slate-500 truncate">
                        {offre.idRecruteur?.nomEntreprise}
                        {offre.localisation ? ` · ${offre.localisation}` : ''}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {offre.typeContrat && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${CONTRACT_COLORS[offre.typeContrat] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                            {offre.typeContrat}
                          </span>
                        )}
                        {offre.salaireMin && (
                          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                            Dès {offre.salaireMin.toLocaleString()} DZD
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => { setActiveTab('matches'); }}
                      title="Voir le match IA pour cette offre"
                      className="shrink-0 flex items-center gap-1 text-xs text-blue-600 font-semibold hover:bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Match IA
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // ── MATCHES : AI recommendation ───────────────────────────────────────────
    if (activeTab === 'matches') {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Match IA</h2>
              <p className="text-slate-500 mt-1">
                L'IA analyse votre CV et vous propose la meilleure offre du moment.
              </p>
            </div>
            <button
              onClick={loadMatch}
              disabled={matchLoading}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${matchLoading ? 'animate-spin' : ''}`} />
              Suivante
            </button>
          </div>

          {applyMsg && (
            <div className={`p-4 rounded-xl text-sm font-medium ${applyMsg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {applyMsg}
            </div>
          )}

          {matchLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 bg-white rounded-2xl border border-slate-100">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              <p className="text-slate-500">L'IA calcule votre meilleur match…</p>
            </div>
          ) : matchError ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <p className="text-slate-500 mb-4">{matchError}</p>
              {matchError.includes('CV') && (
                <button
                  onClick={() => navigate('/onboarding')}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700"
                >
                  Créer mon CV
                </button>
              )}
              <button onClick={loadMatch} className="ml-3 text-slate-500 hover:text-slate-700 text-sm font-medium underline">
                Réessayer
              </button>
            </div>
          ) : matchData ? (
            <MatchCard match={matchData} onApply={handleApply} applying={applying} />
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 h-48 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Target className="w-10 h-10 text-slate-300" />
              <p>Aucune nouvelle offre disponible pour le moment.</p>
              <button onClick={loadMatch} className="text-blue-600 text-sm font-semibold hover:underline">
                Réessayer
              </button>
            </div>
          )}
        </div>
      );
    }

    // ── APPLICATIONS ──────────────────────────────────────────────────────────
    if (activeTab === 'applications') {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Mes Candidatures</h2>
            <p className="text-slate-500 mt-1">Suivez l'état de toutes vos candidatures.</p>
          </div>

          {candsLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : candidatures.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 h-48 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Briefcase className="w-10 h-10 text-slate-300" />
              <p>Vous n'avez pas encore postulé.</p>
              <button
                onClick={() => setActiveTab('matches')}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-blue-700"
              >
                Trouver mon match
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {candidatures.map((c) => {
                const status = STATUS_MAP[c.etatCandidature] || STATUS_MAP.Recue;
                const StatusIcon = status.icon;
                const offre = c.idOffre || {};
                return (
                  <div key={c._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-base font-bold text-slate-400 shrink-0">
                        {offre.titre?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{offre.titre || 'Offre'}</h3>
                        <p className="text-sm text-slate-500">
                          {offre.localisation || ''}
                          {offre.typeContrat ? ` · ${offre.typeContrat}` : ''}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Postulé le {new Date(c.dateCandidature).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${status.color} shrink-0`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </div>
                    {c.entretien?.dateEntretien && (
                      <div className="mt-3 ml-15 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                        <Calendar className="w-4 h-4 shrink-0" />
                        Entretien le {new Date(c.entretien.dateEntretien).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // ── PROFILE ───────────────────────────────────────────────────────────────
    if (activeTab === 'profile') {
      return <ProfileTab />;
    }

    return null;
  };

  // ── Render ────────────────────────────────────────────────────────────────
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

        {/* User mini-profile */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md overflow-hidden shrink-0">
              {currentUser.photoProfil ? (
                <img
                  src={getImageUrl(currentUser.photoProfil)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                (currentUser.prenom?.[0] || 'U').toUpperCase()
              )}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-bold text-slate-900 truncate capitalize">
                {currentUser.prenom || 'Prénom'} {currentUser.nom || ''}
              </p>
              <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">

        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <h1 className="text-xl font-bold text-slate-800 hidden sm:block">
            {navItems.find((i) => i.id === activeTab)?.label}
          </h1>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen((v) => !v);
                  if (unreadCount > 0) handleMarkAllRead();
                }}
                className="relative p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full border border-slate-200 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <p className="font-bold text-slate-800">Notifications</p>
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Fermer
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-slate-400 text-center">Aucune notification</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className={`p-4 text-sm ${n.lu ? 'text-slate-500' : 'text-slate-800 bg-blue-50/40 font-medium'}`}
                        >
                          {n.contenu}
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(n.dateEnvoi).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200" />

            <button
              onClick={() => navigate('/edit-profile')}
              title="Paramètres"
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full border border-transparent hover:border-blue-100 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={handleLogout}
              title="Déconnexion"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full border border-transparent hover:border-red-100 transition-colors"
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

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex border-t border-slate-200 bg-white">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
                  isActive ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </main>
    </div>
  );
}