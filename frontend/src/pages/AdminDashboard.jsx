import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, ShieldCheck, Building, Users, LogOut,
  Search, CheckCircle, XCircle, FileText, AlertTriangle,
  Eye, ChevronRight, Check, Briefcase, Activity, Ban, RefreshCw, X,
  Flag, MessageSquare, Star, EyeOff, Trash2, ChevronDown, Loader2,
  Info, Percent, Sparkles, AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import AdminSignalements from '../components/Adminsignalements';
import AdminCommentaires from '../components/Admincommentaires';
import toast, { Toaster } from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:5000/api/admin';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  const [stats, setStats]                   = useState(null);
  const [pendingRecruiters, setPendingRecruiters] = useState([]);
  const [usersList, setUsersList]           = useState([]);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [isLoading, setIsLoading]           = useState(true);
  const [docToView, setDocToView]           = useState(null);
  const [docUrl, setDocUrl]                 = useState(null);
  const [docLoading, setDocLoading]         = useState(false);

  // Rejection modal state
  const [rejectModal, setRejectModal]       = useState(false);
  const [rejectMotif, setRejectMotif]       = useState('');
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [rejectLoading, setRejectLoading]   = useState(false);

  // Comments management state
  const [dossierComments, setDossierComments]     = useState([]);
  const [commentsLoading, setCommentsLoading]     = useState(false);
  const [commentsShown, setCommentsShown]         = useState(false);

  

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // ── API helpers ─────────────────────────────────────────────────────────────
  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/stats`, { headers: getAuthHeaders() });
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const fetchPendingRecruiters = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/recruteurs/en-attente`, { headers: getAuthHeaders() });
      if (res.ok) setPendingRecruiters(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users`, { headers: getAuthHeaders() });
      if (res.ok) { const d = await res.json(); setUsersList(d.users); }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const fetchDossier = async (id) => {
    setIsLoading(true);
    setCommentsShown(false);
    setDossierComments([]);
    try {
      const res = await fetch(`${API_BASE_URL}/recruteurs/${id}/dossier`, { headers: getAuthHeaders() });
      if (res.ok) setSelectedDossier(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const fetchDossierComments = async (recruteurId) => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/commentaires/recruteur/${recruteurId}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setDossierComments(data.commentaires || []);
      }
    } catch (e) { console.error(e); }
    finally { setCommentsLoading(false); }
  };

  const handleToggleCommentVisibility = async (commentId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/commentaires/${commentId}/visibilite`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const { visible } = await res.json();
        setDossierComments(prev =>
          prev.map(c => c._id === commentId ? { ...c, visible } : c)
        );
        toast.success(visible ? 'Commentaire visible' : 'Commentaire masqué');
      }
    } catch (e) { toast.error('Erreur'); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Supprimer ce commentaire ?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/commentaires/${commentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setDossierComments(prev => prev.filter(c => c._id !== commentId));
        toast.success('Commentaire supprimé');
      }
    } catch (e) { toast.error('Erreur'); }
  };

  const handleTriggerVerification = async (docId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/documents/${docId}/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        toast.success('Analyse IA lancée !');
        setTimeout(() => {
          if (selectedDossier) fetchDossier(selectedDossier.recruteur._id);
        }, 3000);
      } else {
        toast.error("Impossible de lancer l'analyse.");
      }
    } catch (e) { console.error(e); }
  };

  // Validate recruiter (approve)
  const handleApprove = async (id) => {
    const toastId = toast.loading('Traitement en cours...');
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}/validate`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ decision: 'valideParAdmin' }),
      });
      if (res.ok) {
        setSelectedDossier(null);
        fetchPendingRecruiters();
        toast.success('Compte validé !', { id: toastId });
      } else {
        toast.error('Erreur lors de la validation.', { id: toastId });
      }
    } catch (e) { toast.error('Erreur réseau.', { id: toastId }); }
  };

  // Open rejection modal
  const openRejectModal = (id) => {
    setRejectTargetId(id);
    setRejectMotif('');
    setRejectModal(true);
  };

  // Confirm rejection with motif
  const handleConfirmReject = async () => {
    if (!rejectMotif.trim()) {
      toast.error('Veuillez saisir un motif de refus.');
      return;
    }
    setRejectLoading(true);
    const toastId = toast.loading('Traitement en cours...');
    try {
      const res = await fetch(`${API_BASE_URL}/users/${rejectTargetId}/validate`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ decision: 'refuse', motif: rejectMotif }),
      });
      if (res.ok) {
        setRejectModal(false);
        setSelectedDossier(null);
        fetchPendingRecruiters();
        toast.success('Dossier refusé.', { id: toastId });
      } else {
        toast.error('Erreur.', { id: toastId });
      }
    } catch (e) { toast.error('Erreur réseau.', { id: toastId }); }
    finally { setRejectLoading(false); }
  };

  const handleToggleSuspend = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}/suspend`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      if (res.ok) { fetchUsers(); toast.success("Statut modifié."); }
      else toast.error("Erreur.");
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (activeTab === 'overview')   fetchStats();
    if (activeTab === 'approvals')  fetchPendingRecruiters();
    if (activeTab === 'users')      fetchUsers();
    // signalements tab is handled by the AdminSignalements component itself
  }, [activeTab]);
  useEffect(() => {
    let objectUrl = null;

    if (docToView?.fileId) {
      setDocLoading(true);
      fetch(`http://localhost:5000/api/documents/file/${docToView.fileId}`, {
        headers: getAuthHeaders(), // <--- This injects your Admin Token securely!
      })
        .then((res) => {
          if (!res.ok) throw new Error('Erreur de chargement');
          return res.blob();
        })
        .then((blob) => {
          // Explicitly define the mime type for PDFs to render correctly in the iframe
          const finalBlob = new Blob([blob], { type: docToView.formatFichier || blob.type });
          objectUrl = URL.createObjectURL(finalBlob);
          setDocUrl(objectUrl);
        })
        .catch((e) => {
          console.error(e);
          toast.error('Impossible de charger le document');
        })
        .finally(() => {
          setDocLoading(false);
        });
    } else {
      setDocUrl(null);
    }

    // Cleanup memory when closing the modal
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [docToView]);

  // ── AI verdict helpers ───────────────────────────────────────────────────────
  const verdictConfig = {
    approuve:          { label: 'Conforme',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle,    dot: 'bg-emerald-500' },
    rejete:            { label: 'Rejeté',          cls: 'bg-red-50 text-red-700 border-red-200',             icon: XCircle,        dot: 'bg-red-500'     },
    necessiteRevision: { label: 'À réviser',       cls: 'bg-amber-50 text-amber-700 border-amber-200',       icon: AlertTriangle,  dot: 'bg-amber-500'   },
    enAttente:         { label: 'Non analysé',     cls: 'bg-slate-50 text-slate-500 border-slate-200',       icon: RefreshCw,      dot: 'bg-slate-400'   },
  };

  const getVerdictCfg = (verdict) => verdictConfig[verdict] || verdictConfig.enAttente;

  const FLAG_LABELS = {
    document_illisible:      'Illisible',
    document_flou:           'Flou / mauvaise qualité',
    document_expire:         'Expiré',
    document_coupe:          'Tronqué',
    document_modifie:        'Potentiellement modifié',
    mauvais_type:            'Type incorrect',
    pas_un_document:         'Pas un document',
    informations_manquantes: 'Infos manquantes',
    langue_incorrecte:       'Langue incorrecte',
    document_etranger:       'Document étranger',
    erreur_ia:               'Erreur IA',
  };

  // ── Star display ─────────────────────────────────────────────────────────────
  const StarDisplay = ({ note }) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= note ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
      ))}
    </div>
  );
  // Simple bar chart for gender distribution
const BarChart = ({ data }) => {
  const total = Object.values(data || {}).reduce((sum, val) => sum + val, 0);
  if (total === 0) return <p className="text-xs text-slate-400">Aucune donnée</p>;
  return (
    <div className="space-y-2">
      {Object.entries(data || {}).map(([label, count]) => (
        <div key={label} className="flex items-center gap-2 text-sm">
          <span className="w-20 text-slate-500 capitalize">{label}</span>
          <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-400 rounded-full"
              style={{ width: `${(count / total) * 100}%` }}
            />
          </div>
          <span className="w-10 text-right font-medium text-slate-600">{count}</span>
        </div>
      ))}
    </div>
  );
};

const renderOverview = () => {
  if (!stats) return (
    <div className="flex items-center justify-center h-[60vh] text-slate-500 gap-3">
      <RefreshCw className="w-6 h-6 animate-spin" />
      <span className="text-lg font-medium">Chargement...</span>
    </div>
  );

  const offresPop = stats.offres?.populaires || [];
  const offresMatch = stats.offres?.lesPlusMatchées || [];
  const offresEmbauche = stats.offres?.meilleurEmbauche || [];
  const engagement = stats.engagementCandidats || {};
  const topCandidats = engagement.topCandidats || [];
  const genre = stats.genreDistribution || {};
  const commentaires = stats.commentaires || {};
    const recruteursEmbauche = stats.offres?.recruteursEmbauche || [];
  

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Vue d'ensemble</h2>
        <p className="text-slate-500 text-sm mt-1">Les performances de MatchTalent en un coup d'œil.</p>
      </div>

      {/* ── Compteurs principaux (inchangés) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Candidats',     value: stats.users.totalCandidats,  icon: Users,      color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { title: 'Recruteurs',    value: stats.users.totalRecruteurs,  icon: Building,   color: 'text-emerald-600',bg: 'bg-emerald-50'},
          { title: 'Offres Actives',value: stats.offres.ouvertes,       icon: Briefcase,  color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { title: 'En attente',    value: stats.users.recruteursEnAttente + stats.users.recruteursValideParIA, icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50'},
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.bg} ${s.color}`}>
              <s.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">{s.title}</p>
              <p className="text-2xl font-black text-slate-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Activité IA (inchangé) ── */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-6 h-6 text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-800">Activité de l'Intelligence Artificielle</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-6">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-slate-500 mb-1 font-medium">Total Matchs Effectués</p>
            <p className="text-2xl font-black text-slate-800">{stats.aiMatch?.totalMatchs || 0}</p>
          </div>
          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
            <p className="text-emerald-700 mb-1 font-medium">Documents Approuvés</p>
            <p className="text-2xl font-black text-emerald-600">{stats.aiVerification.approuves}</p>
          </div>
          <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
            <p className="text-red-700 mb-1 font-medium">Documents Rejetés</p>
            <p className="text-2xl font-black text-red-600">{stats.aiVerification.rejetes}</p>
          </div>
        </div>
      </div>

      {/* ── OFFRES LES PLUS POPULAIRES (candidatures) ── */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" /> Offres les plus demandées (30 derniers jours)
        </h3>
        {offresPop.length === 0 ? (
          <p className="text-slate-400 text-sm">Aucune candidature récente.</p>
        ) : (
          <div className="space-y-4">
            {offresPop.map((o, i) => (
              <div key={o.offreId} className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-400 w-6">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{o.titre}</p>
                  <p className="text-xs text-slate-500">{o.localisation} · {o.typeContrat}</p>
                  <div className="mt-1.5 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.min(100, (o.totalCandidatures / (offresPop[0]?.totalCandidatures || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-black text-indigo-600 whitespace-nowrap">{o.totalCandidatures} candidatures</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MEILLEURS SCORES AI ── */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Percent className="w-5 h-5 text-indigo-600" /> Offres avec le meilleur score de matching AI
        </h3>
        {offresMatch.length === 0 ? (
          <p className="text-slate-400 text-sm">Aucun match calculé.</p>
        ) : (
          <div className="space-y-4">
            {offresMatch.map((o, i) => (
              <div key={o.offreId} className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-400 w-6">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{o.titre}</p>
                  <div className="mt-1.5 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${o.avgScore}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-black text-emerald-600 whitespace-nowrap">{o.avgScore}% moyen</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── RECRUTEURS AVEC LE MEILLEUR TAUX D'EMBAUCHE ── */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-indigo-600" /> Recruteurs avec le meilleur taux d'embauche
        </h3>
        {recruteursEmbauche.length === 0 ? (
          <p className="text-slate-400 text-sm">Aucune embauche enregistrée.</p>
        ) : (
          <div className="space-y-4">
            {recruteursEmbauche.map((r, i) => (
              <div key={r.recruteurId} className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-400 w-6">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">
                    {r.nomEntreprise || r.email}
                  </p>
                  <p className="text-xs text-slate-500">
                    {r.embauchees} embauches / {r.totalCandidatures} candidatures
                  </p>
                  <div className="mt-1.5 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${r.ratioEmbauche}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-black text-amber-600 whitespace-nowrap">
                  {r.ratioEmbauche}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ENGAGEMENT CANDIDATS ── */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" /> Engagement des candidats
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-slate-500 mb-1 font-medium">Candidats actifs</p>
            <p className="text-2xl font-black text-slate-800">{engagement.totalCandidatsActifs || 0}</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-slate-500 mb-1 font-medium">Moyenne de candidatures</p>
            <p className="text-2xl font-black text-slate-800">{engagement.moyCandidaturesParCandidat || 0}</p>
          </div>
        </div>
        {topCandidats.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-600 mb-3">Top 5 candidats les plus actifs</p>
            <div className="space-y-3">
              {topCandidats.map((c, i) => (
                <div key={c.candidatId} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-400 w-6">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{c.prenom} {c.nom}</p>
                    <p className="text-xs text-slate-500">{c.email}</p>
                  </div>
                  <span className="text-sm font-bold text-indigo-600">{c.totalApplications} candidatures</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── GENRE ── */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" /> Répartition par genre
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-slate-600 mb-3">Candidats</p>
            <BarChart data={genre.candidats || {}} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600 mb-3">Recruteurs</p>
            <BarChart data={genre.recruteurs || {}} />
          </div>
        </div>
      </div>

      {/* ── AVIS & COMMENTAIRES ── */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" /> Avis & commentaires
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-slate-500 mb-1 font-medium">Total commentaires</p>
            <p className="text-2xl font-black text-slate-800">{commentaires.total || 0}</p>
          </div>
          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
            <p className="text-amber-700 mb-1 font-medium">Note moyenne</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black text-amber-600">{commentaires.noteMoyenne || 0}</p>
              <StarDisplay note={Math.round(commentaires.noteMoyenne) || 0} />
            </div>
          </div>
          <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
            <p className="text-red-700 mb-1 font-medium">Masqués</p>
            <p className="text-2xl font-black text-red-600">{commentaires.hidden || 0}</p>
          </div>
        </div>
      </div>

      {/* ── CROISSANCE UTILISATEURS (30 jours) ── */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" /> Croissance des inscriptions (30 jours)
        </h3>
        {stats.userGrowth?.length > 0 ? (
          <div className="space-y-2">
            {stats.userGrowth.map(day => (
              <div key={day.date} className="flex items-center gap-3 text-sm">
                <span className="w-28 text-slate-500 font-medium">{day.date}</span>
                <div className="flex-1 h-5 bg-indigo-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${Math.min(100, (day.count / Math.max(...stats.userGrowth.map(d => d.count))) * 100)}%` }}
                  >
                    <span className="text-[10px] font-bold text-white">{day.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Données insuffisantes.</p>
        )}
      </div>
    </div>
  );
};

  // ── RENDER: Approvals list ───────────────────────────────────────────────────
  const renderApprovalsList = () => (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Vérification des Entreprises</h2>
          <p className="text-slate-500 text-sm mt-1">Examinez les dossiers en attente ou pré-validés par l'IA.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Rechercher..." className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-sm w-72" />
        </div>
      </div>
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-sm border-b border-slate-100">
              <th className="font-medium py-4 px-6">Entreprise & Contact</th>
              <th className="font-medium py-4 px-6 text-center">Pré-analyse IA</th>
              <th className="font-medium py-4 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingRecruiters.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-12 text-center text-slate-500 font-medium">Aucune entreprise en attente de validation.</td>
              </tr>
            ) : pendingRecruiters.map(recruteur => (
              <tr key={recruteur._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 text-indigo-600 flex items-center justify-center font-bold">
                    <Building className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 mb-0.5">{recruteur.nomEntreprise || recruteur.nom || 'Non spécifié'}</p>
                    <p className="text-xs text-slate-500">{recruteur.email}</p>
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className={`inline-flex items-center gap-1.5 font-bold text-sm px-3 py-1 rounded-lg ${recruteur.etatValidation === 'valideParIA' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {recruteur.etatValidation === 'valideParIA' ? <ShieldCheck className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                    {recruteur.etatValidation === 'valideParIA' ? 'Favorable' : 'En attente'}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <button onClick={() => fetchDossier(recruteur._id)} className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold transition-all">
                    Examiner <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── RENDER: Users ────────────────────────────────────────────────────────────
  const renderUsers = () => (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestion des Utilisateurs</h2>
          <p className="text-slate-500 text-sm mt-1">Gérez tous les comptes Candidats et Recruteurs.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Rechercher..." className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-sm w-72" />
        </div>
      </div>
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-sm border-b border-slate-100">
              <th className="font-medium py-4 px-6">Utilisateur</th>
              <th className="font-medium py-4 px-6">Rôle</th>
              <th className="font-medium py-4 px-6 text-center">Statut Compte</th>
              <th className="font-medium py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersList.map(user => (
              <tr key={user._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6">
                  <p className="font-bold text-slate-800">{user.nom} {user.prenom}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </td>
                <td className="py-4 px-6 text-sm font-medium text-slate-600 capitalize">{user.role}</td>
                <td className="py-4 px-6 text-center">
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${user.statusCompte === 'actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {user.statusCompte}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <button onClick={() => handleToggleSuspend(user._id)}
                    className={`p-2 transition-colors ${user.statusCompte === 'actif' ? 'text-slate-400 hover:text-red-600' : 'text-red-500 hover:text-emerald-600'}`}
                    title={user.statusCompte === 'actif' ? 'Bloquer le compte' : 'Réactiver le compte'}>
                    <Ban className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── RENDER: Dossier detail ───────────────────────────────────────────────────
  const renderDossier = () => {
    if (!selectedDossier) return null;
    const { recruteur, documents, aiSummary } = selectedDossier;

    return (
      <div className="animate-fade-in max-w-5xl mx-auto space-y-6">
        <button onClick={() => setSelectedDossier(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors">
          <ChevronRight className="w-5 h-5 rotate-180" /> Retour à la liste
        </button>

        {/* Header + actions */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden flex flex-col lg:flex-row">
          {/* Left column */}
          <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-100 p-8 bg-slate-50/50 flex flex-col">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-slate-100 text-indigo-600 flex items-center justify-center mb-6">
              <Building className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-1">{recruteur.nomEntreprise || recruteur.nom}</h3>
            <p className="text-sm text-slate-500 mb-2">{recruteur.email}</p>
            <span className={`self-start text-xs font-bold px-2.5 py-1 rounded-full border mb-6 ${
              recruteur.etatValidation === 'valideParIA'  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
              recruteur.etatValidation === 'enAttente'    ? 'bg-amber-50 text-amber-700 border-amber-100'       :
              'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              {recruteur.etatValidation === 'valideParIA'  ? ' Pré-approuvé par IA' :
               recruteur.etatValidation === 'enAttente'    ? ' En attente'           :
               recruteur.etatValidation}
            </span>

            {/* AI Summary */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-bold text-slate-700">Bilan IA</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Approuvés</span>
                  <span className="font-bold text-emerald-600">{aiSummary.approuves}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Rejetés</span>
                  <span className="font-bold text-red-600">{aiSummary.rejetes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">À réviser</span>
                  <span className="font-bold text-amber-600">{aiSummary.necessiteRevision}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Non analysés</span>
                  <span className="font-bold text-slate-500">{aiSummary.enAttente}</span>
                </div>
              </div>
            </div>

            {/* Decision buttons */}
            <div className="mt-auto space-y-3 pt-6 border-t border-slate-200">
              <button onClick={() => handleApprove(recruteur._id)}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all">
                <CheckCircle className="w-5 h-5" /> Valider l'entreprise
              </button>
              <button onClick={() => openRejectModal(recruteur._id)}
                className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-red-400 text-slate-600 hover:text-red-600 hover:bg-red-50 py-3 rounded-xl font-bold transition-all">
                <XCircle className="w-5 h-5" /> Refuser la demande
              </button>
            </div>
          </div>

          {/* Right column: documents */}
          <div className="w-full lg:w-2/3 p-8">
            <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> Documents soumis ({documents.length})
            </h4>
            <div className="space-y-4">
              {documents.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Aucun document téléversé.</p>
              ) : documents.map(doc => {
                const ai = doc.aiVerification;
                const cfg = getVerdictCfg(ai?.verdict || 'enAttente');
                const VerdictIcon = cfg.icon;

                return (
                  <div key={doc._id} className={`border rounded-2xl overflow-hidden transition-all ${
                    ai?.verdict === 'approuve'          ? 'border-emerald-200' :
                    ai?.verdict === 'rejete'            ? 'border-red-200'     :
                    ai?.verdict === 'necessiteRevision' ? 'border-amber-200'   :
                                                          'border-slate-200'
                  }`}>
                    {/* Document header row */}
                    <div className="flex items-center gap-4 p-4 bg-white">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.cls}`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{doc.nomFichier}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">Type déclaré : <span className="font-medium text-slate-600">{doc.typeDocument || 'non précisé'}</span></span>
                          {ai?.typeDetecte && ai.typeDetecte !== 'unknown' && (
                            <span className="text-xs text-indigo-500">· Détecté : <span className="font-medium">{ai.typeDetecte}</span></span>
                          )}
                        </div>
                      </div>
                      {/* Verdict badge */}
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border shrink-0 ${cfg.cls}`}>
                        <VerdictIcon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                    </div>

                    {/* AI details panel */}
                    {ai && (
                      <div className={`px-4 pb-4 pt-1 ${
                        ai.verdict === 'approuve'          ? 'bg-emerald-50/40' :
                        ai.verdict === 'rejete'            ? 'bg-red-50/40'     :
                        ai.verdict === 'necessiteRevision' ? 'bg-amber-50/40'   :
                                                              'bg-slate-50/40'
                      }`}>
                        {/* Confidence bar */}
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xs font-semibold text-slate-500 w-20 shrink-0">Confiance IA</span>
                          <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                ai.confidence >= 70 ? 'bg-emerald-500' :
                                ai.confidence >= 50 ? 'bg-amber-500'   : 'bg-red-500'
                              }`}
                              style={{ width: `${ai.confidence}%` }}
                            />
                          </div>
                          <span className={`text-xs font-black w-10 text-right ${
                            ai.confidence >= 70 ? 'text-emerald-600' :
                            ai.confidence >= 50 ? 'text-amber-600'   : 'text-red-600'
                          }`}>{ai.confidence}%</span>
                        </div>

                        {/* Reason */}
                        {ai.raison && (
                          <div className="flex items-start gap-2 mb-3">
                            <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-600 leading-relaxed">{ai.raison}</p>
                          </div>
                        )}

                        {/* Flags */}
                        {ai.flags && ai.flags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {ai.flags.map(flag => (
                              <span key={flag} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200">
                                ⚑ {FLAG_LABELS[flag] || flag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Model + date */}
                        <p className="text-[10px] text-slate-400 mt-2">
                          Analysé par {ai.modelUtilise} · {new Date(ai.dateVerification).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 px-4 pb-4">
                      <button onClick={() => handleTriggerVerification(doc._id)}
                        className="flex items-center gap-1.5 bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-600 border border-slate-200 hover:border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" /> Relancer IA
                      </button>
                      <button onClick={() => setDocToView(doc)}
                        className="flex items-center gap-1.5 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                        <Eye className="w-3.5 h-3.5" /> Visualiser
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Comments section ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <button
            onClick={() => {
              if (!commentsShown) {
                fetchDossierComments(recruteur._id);
                setCommentsShown(true);
              } else {
                setCommentsShown(v => !v);
              }
            }}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              <span className="font-bold text-slate-800">Avis candidats sur ce recruteur</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${commentsShown ? 'rotate-180' : ''}`} />
          </button>

          {commentsShown && (
            <div className="border-t border-slate-100 p-6">
              {commentsLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" /> Chargement…
                </div>
              ) : dossierComments.length === 0 ? (
                <p className="text-center text-slate-400 py-6 text-sm">Aucun avis pour ce recruteur.</p>
              ) : (
                <div className="space-y-3">
                  {dossierComments.map(c => (
                    <div key={c._id} className={`border rounded-2xl p-4 transition-all ${!c.visible ? 'opacity-50 border-dashed border-slate-300' : 'border-slate-100'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {(c.idAuteur?.prenom?.[0] || '') + (c.idAuteur?.nom?.[0] || '')}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 text-sm">{c.idAuteur?.prenom} {c.idAuteur?.nom}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <StarDisplay note={c.note} />
                              <span className="text-xs text-slate-400">
                                {new Date(c.dateCreation).toLocaleDateString('fr-FR')}
                              </span>
                              {!c.visible && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-500">Masqué</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleToggleCommentVisibility(c._id)}
                            title={c.visible ? 'Masquer' : 'Rendre visible'}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            {c.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            title="Supprimer"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{c.contenu}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Shell ────────────────────────────────────────────────────────────────────
  const TAB_LABELS = {
    overview:      "Vue d'ensemble",
    approvals:     'Validations',
    users:         'Utilisateurs',
    signalements:  'Signalements',
    commentaires:  'Avis',
  };

  const navItems = [
    { id: 'overview',      label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: 'approvals',     label: 'Validations',     icon: ShieldCheck     },
    { id: 'users',         label: 'Utilisateurs',    icon: Users           },
    { id: 'signalements',  label: 'Signalements',    icon: Flag            },
    { id: 'commentaires',  label: 'Avis',            icon: MessageSquare   },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Toaster position="top-right" reverseOrder={false} />

      {/* ── SIDEBAR ── */}
      <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col z-20">
        <div className="h-20 flex items-center px-8 border-b border-slate-200">
          <Logo />
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 mt-2">Panel Admin</p>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSelectedDossier(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
              {id === 'approvals' && pendingRecruiters.length > 0 && (
                <span className="ml-auto bg-indigo-100 text-indigo-700 text-xs py-0.5 px-2 rounded-full font-bold">
                  {pendingRecruiters.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <h2 className="text-xl font-bold text-slate-800">
            {selectedDossier
              ? `Dossier : ${selectedDossier.recruteur.nomEntreprise || selectedDossier.recruteur.nom}`
              : TAB_LABELS[activeTab] || ''}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Super Admin</span>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">SA</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative">
          {isLoading && activeTab !== 'signalements' && (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
          )}

          {!isLoading && activeTab === 'overview'  && !selectedDossier && renderOverview()}
          {!isLoading && activeTab === 'users'     && !selectedDossier && renderUsers()}
          {!isLoading && activeTab === 'approvals' && !selectedDossier && renderApprovalsList()}
          {!isLoading && activeTab === 'approvals' && selectedDossier  && renderDossier()}

          {/* Signalements tab — component manages its own loading */}
          {activeTab === 'signalements' && !selectedDossier && <AdminSignalements />}

          {/* Avis tab — component manages its own loading */}
          {activeTab === 'commentaires' && !selectedDossier && <AdminCommentaires />}
        </div>
      </main>

      {/* ── Rejection modal ── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-bold text-slate-800">Motif de refus</h3>
              </div>
              <button onClick={() => setRejectModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                Ce motif sera communiqué au recruteur par notification et visible depuis son espace.
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Motif de refus *</label>
                <textarea
                  rows={4}
                  placeholder="Ex : Les documents fournis ne permettent pas de confirmer l'identité légale de l'entreprise…"
                  value={rejectMotif}
                  onChange={e => setRejectMotif(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-300 outline-none text-slate-700 resize-none text-sm"
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{rejectMotif.length} / 500</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setRejectModal(false)}
                  className="flex-1 py-3 rounded-xl font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                  Annuler
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={rejectLoading || !rejectMotif.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {rejectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Confirmer le refus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Document viewer modal ── */}
{/* ── Document viewer modal ── */}
      {docToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  docToView.aiVerification?.verdict === 'approuve' ? 'bg-emerald-100 text-emerald-600' :
                  docToView.aiVerification?.verdict === 'rejete'   ? 'bg-red-100 text-red-600'         :
                                                                      'bg-amber-100 text-amber-600'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{docToView.nomFichier}</h3>
                  <p className="text-xs text-slate-500">
                    Verdict IA : <span className="uppercase font-semibold">{docToView.aiVerification?.verdict || 'Non vérifié'}</span>
                    {docToView.aiVerification?.confidence != null && ` · Confiance : ${docToView.aiVerification.confidence}%`}
                  </p>
                </div>
              </div>
              <button onClick={() => setDocToView(null)}
                className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* --- UPDATED VIEWER AREA --- */}
            <div className="flex-1 bg-slate-100 p-4 overflow-auto min-h-[50vh] flex items-center justify-center">
              {!docToView.fileId ? (
                <div className="text-center text-slate-400 flex flex-col items-center">
                  <AlertTriangle className="w-12 h-12 mb-3 text-slate-300" />
                  <p className="font-medium text-slate-500">Fichier introuvable.</p>
                </div>
              ) : docLoading ? (
                <div className="text-center text-indigo-500 flex flex-col items-center">
                  <Loader2 className="w-10 h-10 mb-3 animate-spin" />
                  <p className="font-medium text-slate-500">Chargement sécurisé du document...</p>
                </div>
              ) : docUrl ? (
                docToView.formatFichier?.startsWith('image/') ? (
                  <img
                    src={docUrl}
                    alt={docToView.nomFichier}
                    className="max-w-full max-h-full rounded-lg shadow-sm border border-slate-200"
                  />
                ) : (
                  <iframe
                    src={docUrl}
                    title="Visionneuse de document"
                    className="w-full h-full min-h-[60vh] rounded-xl border border-slate-200 bg-white shadow-sm"
                  />
                )
              ) : (
                <div className="text-center text-red-400 flex flex-col items-center">
                  <AlertTriangle className="w-12 h-12 mb-3" />
                  <p className="font-medium">Échec du chargement.</p>
                </div>
              )}
            </div>
            {/* --- END OF UPDATED VIEWER AREA --- */}

            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button onClick={() => setDocToView(null)} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}