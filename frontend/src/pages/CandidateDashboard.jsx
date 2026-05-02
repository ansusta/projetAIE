import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Home, Target, User, Briefcase, Bell, Search,
  MapPin, Euro, Sparkles, Settings, LogOut,
  Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle,
  Calendar, ChevronRight, X, ExternalLink, FileText,
  CheckCheck, Users, Clock, Building, History,
} from 'lucide-react';
import { useNavigate, useLocation  } from 'react-router-dom';
import { authService }        from '../services/auth.service';
import { matchService }       from '../services/match.service';
import { candidatureService } from '../services/candidature.service';
import { notificationService }from '../services/notification.service';
import { offreService }       from '../services/offre.service';
import Logo       from '../components/Logo';
import ProfileTab from './ProfileTab';

// ── Helpers ──────────────────────────────────────────────────────────────────
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${path}`;
};
// Helpers pour le formatage
  const formatGenre = (g) => {
    const map = { homme: 'Homme', femme: 'Femme', autre: 'Autre', nonSpecifie: 'Non spécifié' };
    return map[g] || 'Non renseigné';
  };

  const formatBirthday = (d) => {
    if (!d) return 'Non renseigné';
    return new Date(d).toLocaleDateString('fr-FR');
  };

const CONTRACT_COLOR = {
  CDI:       'bg-blue-50 text-blue-700 border-blue-100',
  CDD:       'bg-amber-50 text-amber-700 border-amber-100',
  stage:     'bg-indigo-50 text-indigo-700 border-indigo-100',
  freelance: 'bg-purple-50 text-purple-700 border-purple-100',
};

const STATUS_MAP = {
  Recue:                { label: 'Reçue',          color: 'bg-slate-100 text-slate-600',  Icon: AlertCircle },
  demandeDocSupp:       { label: 'Docs demandés',  color: 'bg-amber-50 text-amber-700',   Icon: AlertCircle },
  convocationEntretien: { label: 'Entretien',       color: 'bg-blue-50 text-blue-700',     Icon: Calendar    },
  Embauchee:            { label: 'Acceptée 🎉',    color: 'bg-green-50 text-green-700',   Icon: CheckCircle },
  refusee:              { label: 'Refusée',          color: 'bg-red-50 text-red-600',       Icon: XCircle     },
};


// ── Preference filter helper ──────────────────────────────────────────────────
function applyPreferenceFilter(offres, user) {
  const prefs = user.preferences || user.preference || {};
  let filtered = [...offres];
  const contrats  = prefs.typesContratSouhaite    || [];
  const secteurs  = prefs.secteursSouhaites        || [];
  const locs      = prefs.localisationsSouhaitees  || [];
  if (contrats.length > 0) filtered = filtered.filter(o => contrats.some(c => c.toLowerCase() === (o.typeContrat || '').toLowerCase()));
  if (secteurs.length > 0) filtered = filtered.filter(o => { const sec = o.idRecruteur?.secteurActivite || ''; return secteurs.some(s => sec.toLowerCase().includes(s.toLowerCase())); });
  if (locs.length > 0) filtered = filtered.filter(o => { const loc = (o.localisation || '').toLowerCase(); return locs.some(l => loc.includes(l.toLowerCase())); });
  return filtered;
}

function hasPreferences(user) {
  const p = user.preferences || user.preference || {};
  return p.typesContratSouhaite?.length > 0 || p.secteursSouhaites?.length > 0 || p.localisationsSouhaitees?.length > 0;
}

// ── Target audience badges ────────────────────────────────────────────────────
function TargetBadges({ filtres }) {
  if (!filtres) return null;
  const { ageMin, ageMax, genres } = filtres;
  const hasAge   = ageMin || ageMax;
  const hasGenre = genres?.length > 0;
  if (!hasAge && !hasGenre) return null;
  const genreLabel = { homme: 'Hommes', femme: 'Femmes', autre: 'Autre', nonSpecifie: 'Non précisé' };
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {hasAge && (
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-100">
          <Clock className="w-3 h-3" />
          {ageMin && ageMax ? `${ageMin}–${ageMax} ans` : ageMin ? `+${ageMin} ans` : `≤${ageMax} ans`}
        </span>
      )}
      {hasGenre && genres.map(g => (
        <span key={g} className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 border border-pink-100">
          <Users className="w-3 h-3" />{genreLabel[g] || g}
        </span>
      ))}
    </div>
  );
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const color  = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-500' : 'text-red-500';
  const border = score >= 80 ? 'border-green-200' : score >= 60 ? 'border-amber-200' : 'border-red-200';
  return (
    <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-full border-4 ${border} shrink-0`}>
      <span className={`text-base font-black ${color}`}>{score}%</span>
      <span className="text-[9px] text-slate-400 font-semibold">MATCH</span>
    </div>
  );
}

// ── Small score pill (used in history list) ───────────────────────────────────
function ScorePill({ score }) {
  const color = score >= 80
    ? 'bg-green-50 text-green-700 border-green-200'
    : score >= 60
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-red-50 text-red-600 border-red-200';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full border ${color}`}>
      <Sparkles className="w-3 h-3" />{score}%
    </span>
  );
}

// ── Offer detail panel ────────────────────────────────────────────────────────
function OffreDetailPanel({ offre, onApply, applying, alreadyApplied }) {
  const navigate  = useNavigate();
  const location = useLocation();
  const recruteur = offre.idRecruteur || {};
  return (
    <div className="p-5 sm:p-6 bg-slate-50/50 border-t border-slate-100 animate-fade-in-down rounded-b-2xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {offre.description && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Description</h4>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-slate-100 shadow-sm">{offre.description}</p>
            </div>
          )}
          {offre.requis?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Prérequis</h4>
              <ul className="grid grid-cols-1 gap-2">
                {offre.requis.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 bg-blue-50/30 p-2.5 rounded-lg">
                    <span className="text-blue-500 font-bold mt-0.5">•</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(offre.filtresPersonnels?.ageMin || offre.filtresPersonnels?.ageMax || offre.filtresPersonnels?.genres?.length > 0) && (
            <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl">
              <p className="text-xs font-bold text-violet-700 mb-1.5">🎯 Critères de ciblage</p>
              <p className="text-xs text-violet-600">
                {offre.filtresPersonnels.ageMin && `Âge minimum : ${offre.filtresPersonnels.ageMin} ans. `}
                {offre.filtresPersonnels.ageMax && `Âge maximum : ${offre.filtresPersonnels.ageMax} ans. `}
                {offre.filtresPersonnels.genres?.length > 0 && `Genre : ${offre.filtresPersonnels.genres.join(', ')}.`}
              </p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Entreprise</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-400">
                {recruteur.nomEntreprise?.[0] || '?'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{recruteur.nomEntreprise || 'Entreprise'}</p>
                <p className="text-xs text-slate-500">{recruteur.secteurActivite}</p>
              </div>
            </div>
            <button onClick={() => navigate(`/recruteur/${recruteur._id || 'unknown'}`)}
              className="w-full text-xs text-blue-600 font-semibold py-2 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 mb-4">
              Voir le profil <ExternalLink className="w-3 h-3" />
            </button>
            <hr className="mb-4 border-slate-100" />
            {alreadyApplied ? (
              <div className="flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 rounded-xl font-semibold text-sm">
                <CheckCircle className="w-5 h-5" /> Candidature envoyée
              </div>
            ) : (
              <button onClick={() => onApply(offre._id)} disabled={applying}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-60 transition-all">
                {applying ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</> : <><FileText className="w-4 h-4" /> Postuler maintenant</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Candidature Detail Panel ──────────────────────────────────────────────────
function CandidatureDetailPanel({ candidature, onClose }) {
  const navigate = useNavigate();
  const offre = candidature.idOffre || {};
  const recruteur = offre.idRecruteur || {};
  const st = STATUS_MAP[candidature.etatCandidature] || STATUS_MAP.Recue;

  return (
    <div className="mt-3 p-5 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-4">
      {/* Offer info */}
      {offre.description && (
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Description du poste</h4>
          <p className="text-sm text-slate-700 leading-relaxed line-clamp-4 bg-white p-3 rounded-xl border border-slate-100">{offre.description}</p>
        </div>
      )}
      {offre.requis?.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Prérequis</h4>
          <div className="flex flex-wrap gap-1.5">
            {offre.requis.map((r, i) => (
              <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-100">{r}</span>
            ))}
          </div>
        </div>
      )}
      {/* Recruiter info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">
            {(recruteur.nomEntreprise || offre.titre || '?')[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{recruteur.nomEntreprise || 'Entreprise'}</p>
            {recruteur.secteurActivite && <p className="text-xs text-slate-500">{recruteur.secteurActivite}</p>}
          </div>
        </div>
        {recruteur._id && (
          <button onClick={() => navigate(`/recruteur/${recruteur._id}`)}
            className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors">
            <Building className="w-3.5 h-3.5" /> Voir le recruteur
          </button>
        )}
      </div>
      {/* Entretien */}
      {candidature.entretien?.dateEntretien && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-blue-700">Entretien planifié</p>
            <p className="text-sm text-blue-800">
              {new Date(candidature.entretien.dateEntretien).toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
              })}
            </p>
            {candidature.entretien.feedbackRecruteur && (
              <p className="text-xs text-blue-600 mt-0.5 italic">"{candidature.entretien.feedbackRecruteur}"</p>
            )}
          </div>
        </div>
      )}
      <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1">
        <X className="w-3.5 h-3.5" /> Réduire
      </button>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function CandidatDashboard() {
  const navigate  = useNavigate();
  const [activeTab, setActiveTab] = useState('home');

  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem('user')) || {}
  );

  // Offers
  const [offres, setOffres]                 = useState([]);
  const [offresLoading, setOffresLoading]   = useState(false);
  const [search, setSearch]                 = useState('');
  const [selectedOffre, setSelectedOffre]   = useState(null);
  const [applyingId, setApplyingId]         = useState(null);
  const [appliedIds, setAppliedIds]         = useState(new Set());

  // Match
  const [matchData, setMatchData]           = useState(null);
  const [matchLoading, setMatchLoading]     = useState(false);
  const [matchError, setMatchError]         = useState('');
  const [matchApplying, setMatchApplying]   = useState(false);
  const [matchApplyMsg, setMatchApplyMsg]   = useState('');
  const [prefFilterOn, setPrefFilterOn]     = useState(false);

  // Match history
  const [matchHistory, setMatchHistory]         = useState([]);
  const [historyLoading, setHistoryLoading]     = useState(false);
  const [historyError, setHistoryError]         = useState('');
  const [historyApplyingId, setHistoryApplyingId] = useState(null);
  const [historyApplyMsgs, setHistoryApplyMsgs] = useState({}); // { offreId: msg }
  const [expandedHistory, setExpandedHistory]   = useState(null);

  // Applications
  const [candidatures, setCandidatures]     = useState([]);
  const [candsLoading, setCandsLoading]     = useState(false);
  const [expandedCand, setExpandedCand]     = useState(null);

  // Notifications
  const [notifications, setNotifications]  = useState([]);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [notifOpen, setNotifOpen]           = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    authService.getMe().then(d => {
      const u = d.user || d;
      setCurrentUser(u);
      localStorage.setItem('user', JSON.stringify(u));
    }).catch(() => {});
    notificationService.getAll().then(data => {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.lu).length);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'home' && offres.length === 0)                    loadOffres();
    if (activeTab === 'matches' && !matchData && !matchLoading)         loadMatch();
    if (activeTab === 'history' && matchHistory.length === 0)           loadMatchHistory();
    if (activeTab === 'applications' && candidatures.length === 0)      loadCandidatures();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  useEffect(() => {
  const state = location.state;
  if (!state?.candidatureId || !candidatures.length) return;

  setActiveTab('candidatures');           // switch to the candidatures tab
  setExpandedCand(state.candidatureId);  // expand the matching card

  // Clear the state so a refresh doesn't re-trigger it
  window.history.replaceState({}, '');
}, [candidatures, location.state]);



  const loadOffres = useCallback(async (q = '') => {
    setOffresLoading(true);
    try {
      const data = await offreService.lister({ search: q, limit: 50 });
      setOffres(data.offres || []);
    } catch { /* silent */ }
    finally { setOffresLoading(false); }
  }, []);

  const loadMatch = useCallback(async (withPref = prefFilterOn) => {
    setMatchLoading(true);
    setMatchError('');
    setMatchData(null);
    setMatchApplyMsg('');
    try {
      const data = await matchService.getRecommandations();
      // client-side pref filter
      if (withPref && hasPreferences(currentUser) && data.match) {
        const filtered = applyPreferenceFilter([data.match.offre], currentUser);
        if (filtered.length === 0) {
          // auto turn off
          setPrefFilterOn(false);
          setMatchData(data.match);
        } else {
          setMatchData(data.match);
        }
      } else {
        setMatchData(data.match);
      }
    } catch (err) {
      setMatchError(err.response?.data?.error || 'Impossible de charger la recommandation.');
    } finally { setMatchLoading(false); }
  }, [currentUser, prefFilterOn]);

  const loadMatchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const history = await matchService.getHistory();
      setMatchHistory(history || []);
    } catch (err) {
      setHistoryError(err.response?.data?.error || 'Impossible de charger l\'historique.');
    } finally { setHistoryLoading(false); }
  }, []);

  const loadCandidatures = useCallback(async () => {
    setCandsLoading(true);
    try {
      const data = await candidatureService.mesCandidatures();
      setCandidatures(data);
      setAppliedIds(new Set(data.map(c => c.idOffre?._id || c.idOffre)));
    } catch { /* silent */ }
    finally { setCandsLoading(false); }
  }, []);

  const handleDirectApply = async (offreId) => {
    setApplyingId(offreId);
    try {
      await candidatureService.soumettre(offreId);
      setAppliedIds(prev => new Set([...prev, offreId]));
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la candidature.');
    } finally { setApplyingId(null); }
  };

  const handleMatchApply = async (offreId) => {
    setMatchApplying(true);
    setMatchApplyMsg('');
    try {
      const res = await matchService.apply(offreId);
      setMatchApplyMsg(`✅ Candidature envoyée ! Score IA : ${res.matchScore}%`);
      setMatchData(null);
    } catch (err) {
      setMatchApplyMsg(`❌ ${err.response?.data?.error || 'Erreur lors de la candidature.'}`);
    } finally { setMatchApplying(false); }
  };

  // Apply from history, then refresh the history entry in-place
  const handleHistoryApply = async (offreId) => {
    setHistoryApplyingId(offreId);
    setHistoryApplyMsgs(prev => ({ ...prev, [offreId]: '' }));
    try {
      const res = await matchService.apply(offreId);
      setHistoryApplyMsgs(prev => ({
        ...prev,
        [offreId]: `✅ Candidature envoyée ! Score IA : ${res.matchScore}%`,
      }));
      // Mark the entry as applied locally — no need to re-fetch the whole list
      setMatchHistory(prev =>
        prev.map(m => m.offre._id === offreId ? { ...m, applied: true } : m)
      );
    } catch (err) {
      setHistoryApplyMsgs(prev => ({
        ...prev,
        [offreId]: `❌ ${err.response?.data?.error || 'Erreur lors de la candidature.'}`,
      }));
    } finally { setHistoryApplyingId(null); }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
    setUnreadCount(0);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadOffres(search);
  };

  const navItems = [
    { id: 'home',         label: 'Offres',       icon: Home      },
    { id: 'matches',      label: 'Match IA',     icon: Target    },
    { id: 'history',      label: 'Historique',   icon: History   },
    { id: 'applications', label: 'Candidatures', icon: Briefcase },
    { id: 'profile',      label: 'Mon Profil',   icon: User      },
  ];

  const renderContent = () => {

    // ── HOME ─────────────────────────────────────────────────────────────────
    if (activeTab === 'home') return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Offres d'emploi</h2>
            <p className="text-slate-500 mt-1 text-sm">Toutes les offres ouvertes · cliquez pour les détails</p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-52">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Titre, mots-clés…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">
              Chercher
            </button>
          </form>
        </div>

        {offresLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : offres.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
            <p>Aucune offre trouvée.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {offres.map(offre => {
              const rec       = offre.idRecruteur || {};
              const applied   = appliedIds.has(offre._id);
              const isSelected= selectedOffre?._id === offre._id;

              return (
                <div key={offre._id} className={`bg-white rounded-2xl border transition-all ${isSelected ? 'border-blue-300 shadow-md ring-2 ring-blue-50' : 'border-slate-200 shadow-sm hover:border-blue-200'}`}>
                  <div onClick={() => setSelectedOffre(isSelected ? null : offre)} className="p-5 cursor-pointer group">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-base font-bold text-slate-400 shrink-0 group-hover:bg-blue-50 transition-colors">
                        {rec.nomEntreprise?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">{offre.titre}</h3>
                        <p className="text-sm text-slate-500 truncate">
                          {rec.nomEntreprise}{offre.localisation ? ` · ${offre.localisation}` : ''}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {offre.typeContrat && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${CONTRACT_COLOR[offre.typeContrat] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                              {offre.typeContrat}
                            </span>
                          )}
                          {offre.salaireMin && (
                            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                              Dès {offre.salaireMin.toLocaleString()} DZD
                            </span>
                          )}
                        </div>
                        <TargetBadges filtres={offre.filtresPersonnels} />
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {applied ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                            <CheckCircle className="w-3.5 h-3.5" /> Postulé
                          </span>
                        ) : (
                          <button
                            onClick={e => { e.stopPropagation(); handleDirectApply(offre._id); }}
                            disabled={applyingId === offre._id}
                            className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-all">
                            {applyingId === offre._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                            Postuler
                          </button>
                        )}
                        <div className="mt-1 flex items-center text-xs text-slate-400 font-medium group-hover:text-blue-500 transition-colors">
                          {isSelected ? 'Fermer' : 'Détails'}
                          <ChevronRight className={`w-4 h-4 ml-1 transition-transform duration-200 ${isSelected ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <OffreDetailPanel offre={offre} onApply={handleDirectApply}
                      applying={applyingId === offre._id} alreadyApplied={applied} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );

    // ── MATCH IA ──────────────────────────────────────────────────────────────
    if (activeTab === 'matches') return (
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Match IA</h2>
            <p className="text-slate-500 mt-1 text-sm">L'IA analyse votre CV et vous propose la meilleure offre.</p>
          </div>
          <button onClick={() => loadMatch(prefFilterOn)} disabled={matchLoading}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg font-semibold disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${matchLoading ? 'animate-spin' : ''}`} />
            Suivante
          </button>
        </div>

        {/* Preference filter toggle — inside match only */}
        {hasPreferences(currentUser) && (
          <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
            <Target className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-sm font-medium text-slate-700 flex-1">Filtrer selon mes préférences</span>
            <button
              onClick={() => { const next = !prefFilterOn; setPrefFilterOn(next); loadMatch(next); }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${prefFilterOn ? 'bg-indigo-600' : 'bg-slate-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${prefFilterOn ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        )}

        {matchApplyMsg && (
          <div className={`p-4 rounded-xl text-sm font-medium border ${
            matchApplyMsg.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
          }`}>{matchApplyMsg}</div>
        )}

        {matchLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 bg-white rounded-2xl border border-slate-100">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            <p className="text-slate-500">L'IA calcule votre meilleur match…</p>
          </div>
        ) : matchError ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-3">
            <p className="text-slate-500">{matchError}</p>
            {matchError.toLowerCase().includes('cv') && (
              <button onClick={() => navigate('/onboarding')} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-blue-700">
                Créer mon CV
              </button>
            )}
            <button onClick={() => loadMatch(prefFilterOn)} className="block mx-auto text-blue-600 text-sm font-medium underline">Réessayer</button>
          </div>
        ) : matchData ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl font-bold text-slate-400 shrink-0">
                {matchData.offre.idRecruteur?.nomEntreprise?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-slate-900">{matchData.offre.titre}</h3>
                <button onClick={() => navigate(`/recruteur/${matchData.offre.idRecruteur?._id || 'unknown'}`)}
                  className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1 mt-0.5">
                  {matchData.offre.idRecruteur?.nomEntreprise || 'Entreprise'}
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <ScoreRing score={matchData.matchScore} />
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {matchData.offre.typeContrat && (
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${CONTRACT_COLOR[matchData.offre.typeContrat] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>{matchData.offre.typeContrat}</span>
              )}
              {matchData.offre.localisation && (
                <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><MapPin className="w-3 h-3" />{matchData.offre.localisation}</span>
              )}
              {matchData.offre.salaireMin && matchData.offre.salaireMax && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100"><Euro className="w-3 h-3" />{matchData.offre.salaireMin.toLocaleString()} – {matchData.offre.salaireMax.toLocaleString()}</span>
              )}
            </div>
            <TargetBadges filtres={matchData.offre.filtresPersonnels} />
            {matchData.offre.description && (
              <p className="text-sm text-slate-600 my-4 line-clamp-3 leading-relaxed">{matchData.offre.description}</p>
            )}
            <button onClick={() => handleMatchApply(matchData.offre._id)} disabled={matchApplying}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-60 transition-all">
              {matchApplying ? <><Loader2 className="w-4 h-4 animate-spin" /> Candidature en cours…</> : <><Sparkles className="w-4 h-4" /> Postuler avec ce match IA</>}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 h-48 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Target className="w-10 h-10 text-slate-300" />
            <p>Aucune nouvelle offre disponible.</p>
            <button onClick={() => loadMatch(false)} className="text-blue-600 text-sm font-semibold hover:underline">
              Chercher sans filtres
            </button>
          </div>
        )}
      </div>
    );

    // ── MATCH HISTORY ─────────────────────────────────────────────────────────
    if (activeTab === 'history') return (
      <div className="space-y-5">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Historique des matchs</h2>
            <p className="text-slate-500 mt-1 text-sm">
              Toutes les offres que l'IA vous a suggérées · postulez aux offres que vous avez manquées.
            </p>
          </div>
          <button
            onClick={loadMatchHistory}
            disabled={historyLoading}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg font-semibold disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {historyLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 bg-white rounded-2xl border border-slate-100">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            <p className="text-slate-500">Chargement de l'historique…</p>
          </div>

        ) : historyError ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-3">
            <p className="text-slate-500">{historyError}</p>
            <button onClick={loadMatchHistory} className="text-blue-600 text-sm font-medium underline">Réessayer</button>
          </div>

        ) : matchHistory.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 h-56 flex flex-col items-center justify-center text-slate-400 gap-3">
            <History className="w-10 h-10 text-slate-300" />
            <p className="font-medium">Aucun match IA pour l'instant.</p>
            <button
              onClick={() => setActiveTab('matches')}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
              Lancer un match IA
            </button>
          </div>

        ) : (
          <div className="space-y-3">
            {matchHistory.map((item) => {
              const offre     = item.offre || {};
              const rec       = offre.idRecruteur || {};
              const isExpanded = expandedHistory === item.matchId;
              const applyMsg  = historyApplyMsgs[offre._id];
              const isApplying = historyApplyingId === offre._id;

              return (
                <div
                  key={item.matchId}
                  className={`bg-white rounded-2xl border transition-all ${
                    isExpanded
                      ? 'border-blue-200 shadow-md ring-1 ring-blue-50'
                      : 'border-slate-200 shadow-sm hover:border-slate-300'
                  }`}>

                  {/* ── Row header ── */}
                  <div
                    className="p-5 cursor-pointer"
                    onClick={() => setExpandedHistory(isExpanded ? null : item.matchId)}>
                    <div className="flex items-start gap-4">

                      {/* Company initial */}
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-base font-bold text-slate-400 shrink-0">
                        {rec.nomEntreprise?.[0] || offre.titre?.[0] || '?'}
                      </div>

                      {/* Title + meta */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{offre.titre || 'Offre'}</h3>
                        <p className="text-sm text-slate-500 truncate">
                          {rec.nomEntreprise || 'Entreprise'}
                          {offre.localisation ? ` · ${offre.localisation}` : ''}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <ScorePill score={item.matchScore} />
                          {offre.typeContrat && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${CONTRACT_COLOR[offre.typeContrat] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                              {offre.typeContrat}
                            </span>
                          )}
                          {!item.ouvert && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-lg border bg-slate-50 text-slate-400 border-slate-100">
                              Offre fermée
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">
                          Suggéré le {new Date(item.dateCalcul).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </p>
                      </div>

                      {/* Status badge + chevron */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {item.applied ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                            <CheckCircle className="w-3.5 h-3.5" /> Postulé
                          </span>
                        ) : item.ouvert ? (
                          <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                            <Clock className="w-3.5 h-3.5" /> Non postulé
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-slate-400 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                            Fermée
                          </span>
                        )}
                        <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {/* ── Expanded detail ── */}
                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">

                      {/* Description */}
                      {offre.description && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Description</h4>
                          <p className="text-sm text-slate-700 leading-relaxed line-clamp-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {offre.description}
                          </p>
                        </div>
                      )}

                      {/* Requirements */}
                      {offre.requis?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Prérequis</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {offre.requis.map((r, i) => (
                              <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-100">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Salary */}
                      {(offre.salaireMin || offre.salaireMax) && (
                        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100">
                          <Euro className="w-4 h-4 shrink-0" />
                          {offre.salaireMin && offre.salaireMax
                            ? `${offre.salaireMin.toLocaleString()} – ${offre.salaireMax.toLocaleString()} DZD`
                            : offre.salaireMin
                            ? `Dès ${offre.salaireMin.toLocaleString()} DZD`
                            : `Jusqu'à ${offre.salaireMax.toLocaleString()} DZD`}
                        </div>
                      )}

                      {/* Recruiter row + profile link */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">
                            {(rec.nomEntreprise || offre.titre || '?')[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{rec.nomEntreprise || 'Entreprise'}</p>
                            {rec.secteurActivite && <p className="text-xs text-slate-500">{rec.secteurActivite}</p>}
                          </div>
                        </div>
                        {rec._id && (
                          <button
                            onClick={() => navigate(`/recruteur/${rec._id}`)}
                            className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors">
                            <Building className="w-3.5 h-3.5" /> Voir le recruteur
                          </button>
                        )}
                      </div>

                      {/* Apply message */}
                      {applyMsg && (
                        <div className={`p-3 rounded-xl text-sm font-medium border ${
                          applyMsg.startsWith('✅')
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {applyMsg}
                        </div>
                      )}

                      {/* CTA */}
                      {!item.applied && item.ouvert && (
                        <button
                          onClick={() => handleHistoryApply(offre._id)}
                          disabled={isApplying}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-sm shadow-blue-100 disabled:opacity-60 transition-all">
                          {isApplying
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Candidature en cours…</>
                            : <><Sparkles className="w-4 h-4" /> Postuler à cette offre</>}
                        </button>
                      )}

                      {item.applied && (
                        <div className="flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 rounded-xl font-semibold text-sm border border-green-100">
                          <CheckCircle className="w-5 h-5" /> Vous avez déjà postulé à cette offre
                        </div>
                      )}

                      {!item.ouvert && (
                        <div className="flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-400 rounded-xl font-semibold text-sm border border-slate-100">
                          <XCircle className="w-5 h-5" /> Cette offre est maintenant fermée
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedHistory(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> Réduire
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );

    // ── APPLICATIONS ──────────────────────────────────────────────────────────
    if (activeTab === 'applications') return (
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mes Candidatures</h2>
          <p className="text-slate-500 mt-1 text-sm">Suivez l'état de toutes vos candidatures · cliquez pour les détails.</p>
        </div>
        {candsLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>
        ) : candidatures.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 h-48 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Briefcase className="w-10 h-10 text-slate-300" />
            <p>Vous n'avez pas encore postulé.</p>
            <button onClick={() => setActiveTab('home')} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-blue-700">
              Voir les offres
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {candidatures.map(c => {
              const st    = STATUS_MAP[c.etatCandidature] || STATUS_MAP.Recue;
              const offre = c.idOffre || {};
              const isExpanded = expandedCand === c._id;

              return (
                <div key={c._id} className={`bg-white rounded-2xl border transition-all ${isExpanded ? 'border-blue-200 shadow-md ring-1 ring-blue-50' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                  <div className="p-5 cursor-pointer" onClick={() => setExpandedCand(isExpanded ? null : c._id)}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-400 shrink-0">
                        {offre.titre?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{offre.titre || 'Offre'}</h3>
                        <p className="text-sm text-slate-500">
                          {offre.localisation || ''}{offre.typeContrat ? ` · ${offre.typeContrat}` : ''}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Postulé le {new Date(c.dateCandidature).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${st.color}`}>
                          <st.Icon className="w-3.5 h-3.5" />{st.label}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                    {c.entretien?.dateEntretien && !isExpanded && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-xl px-4 py-2.5 ml-14">
                        <Calendar className="w-4 h-4 shrink-0" />
                        Entretien le {new Date(c.entretien.dateEntretien).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="px-5 pb-5">
                      <CandidatureDetailPanel candidature={c} onClose={() => setExpandedCand(null)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );

    if (activeTab === 'profile') return <ProfileTab />;
    return null;
  };

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 z-10">
        <div className="p-6 border-b border-slate-100"><Logo /></div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}>
                <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                {label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md overflow-hidden shrink-0">
              {currentUser.photoProfil
                ? <img src={getImageUrl(currentUser.photoProfil)} alt="Profile" className="w-full h-full object-cover" />
                : (currentUser.prenom?.[0] || 'U').toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-bold text-slate-900 truncate capitalize">{currentUser.prenom || 'Prénom'} {currentUser.nom || ''}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <h1 className="text-xl font-bold text-slate-800 hidden sm:block">
            {navItems.find(i => i.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-3 ml-auto">
            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifOpen(v => !v)}
                className="relative p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full border border-slate-200 transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <p className="font-bold text-slate-800">Notifications</p>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                        <CheckCheck className="w-3.5 h-3.5" /> Tout lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-slate-400 text-center">Aucune notification</p>
                    ) : notifications.slice(0, 5).map(n => (
                      <div key={n._id} className={`p-4 text-sm ${n.lu ? 'text-slate-500' : 'text-slate-800 bg-blue-50/40 font-medium'}`}>
                        {n.contenu}
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(n.dateEnvoi).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setNotifOpen(false); navigate('/notifications'); }}
                    className="w-full py-3 text-sm text-blue-600 font-semibold hover:bg-slate-50 transition-colors border-t border-slate-100 flex items-center justify-center gap-2">
                    Voir toutes <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <button onClick={() => navigate('/edit-profile')} title="Paramètres"
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} title="Déconnexion"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-4xl mx-auto">{renderContent()}</div>
        </div>

        <nav className="md:hidden flex border-t border-slate-200 bg-white z-10">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${active ? 'text-blue-600' : 'text-slate-400'}`}>
                <Icon className="w-5 h-5" />{label}
              </button>
            );
          })}
        </nav>
      </main>
    </div>
  );
}