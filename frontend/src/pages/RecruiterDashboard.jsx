import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EditJobModal from '../components/EditJobModal';
import {
  LayoutDashboard, Briefcase, CalendarDays, Settings, LogOut,
  Bell, Plus, MapPin, Clock, ChevronRight, ChevronDown,
  Loader2, CheckCircle, XCircle, AlertCircle, Star,
  Trash2, CheckCheck, RefreshCw, X, Save, Users,
  Building, Calendar, Mail, Phone, User, Code2,
  GraduationCap, Globe, Heart, FileText, ExternalLink,
  ChevronLeft, Hash
} from 'lucide-react';
import FiltresPersonnelsForm from './Filtrespersonnelsform';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';

const TOKEN = () => localStorage.getItem('token');
const apiFetch = async (path, opts = {}) => {
  const res = await fetch(`http://localhost:5000${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN()}`,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
};

// Notification helper
const notifyCandidat = async (candidatId, contenu, candidatureId = null) => {
  try {
    await apiFetch('/api/notification/send', {
      method: 'POST',
      body: JSON.stringify({ idUtilisateur: candidatId, contenu, idCandidature: candidatureId })
    });
  } catch (e) { console.warn(e); }
};

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUTS = ['Recue', 'demandeDocSupp', 'convocationEntretien', 'Embauchee', 'refusee'];
const STATUT_LABEL = {
  Recue:                { label: 'Reçue',        color: 'bg-slate-100 text-slate-600 border-slate-200' },
  demandeDocSupp:       { label: 'Docs requis',  color: 'bg-amber-50 text-amber-700 border-amber-200' },
  convocationEntretien: { label: 'Entretien',    color: 'bg-blue-50 text-blue-700 border-blue-200' },
  Embauchee:            { label: 'Embauché(e)',  color: 'bg-green-50 text-green-700 border-green-200' },
  refusee:              { label: 'Refusé(e)',    color: 'bg-red-50 text-red-600 border-red-200' },
};
const CONTRACT_COLOR = {
  CDI:       'bg-blue-100 text-blue-800 border-blue-200',
  CDD:       'bg-amber-100 text-amber-800 border-amber-200',
  stage:     'bg-indigo-100 text-indigo-800 border-indigo-200',
  freelance: 'bg-purple-100 text-purple-800 border-purple-200',
};

function ScoreBadge({ score }) {
  if (score == null) return null;
  const color = score >= 80 ? 'bg-green-100 text-green-700 border-green-200'
              : score >= 60 ? 'bg-amber-100 text-amber-700 border-amber-200'
              :               'bg-red-100 text-red-600 border-red-200';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border ${color}`}>
      <Star className="w-3 h-3" /> {score}%
    </span>
  );
}

// ── Create Job Modal (avec champ nombrePostes) ───────────────────────────────
function CreateJobModal({ isOpen, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    titre: '', typeContrat: 'CDI', localisation: '',
    salaireMin: '', salaireMax: '', description: '', requis: '',
    nombrePostes: 1,
  });
  const [filtresPersonnels, setFiltresPersonnels] = useState({ ageMin: null, ageMax: null, genres: [] });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim()) return setError('Le titre est requis.');
    const nbPostes = parseInt(formData.nombrePostes, 10);
    if (isNaN(nbPostes) || nbPostes < 1) return setError('Le nombre de postes doit être au moins 1.');
    setIsLoading(true);
    setError('');
    try {
      const payload = {
        titre: formData.titre,
        typeContrat: formData.typeContrat,
        localisation: formData.localisation,
        description: formData.description,
        requis: formData.requis ? formData.requis.split(',').map(s => s.trim()).filter(Boolean) : [],
        salaireMin: formData.salaireMin ? Number(formData.salaireMin) : undefined,
        salaireMax: formData.salaireMax ? Number(formData.salaireMax) : undefined,
        filtresPersonnels,
        nombrePostes: nbPostes,
      };
      await apiFetch('/api/offre', { method: 'POST', body: JSON.stringify(payload) });
      onSuccess?.(); // ← recharge après création
      onClose();
      setFormData({ titre: '', typeContrat: 'CDI', localisation: '', salaireMin: '', salaireMax: '', description: '', requis: '', nombrePostes: 1 });
      setFiltresPersonnels({ ageMin: null, ageMax: null, genres: [] });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inp = "w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">Créer une nouvelle offre</h2>
            <p className="text-sm text-slate-500 mt-1">Remplissez les détails pour publier votre annonce.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-8 overflow-y-auto flex-1">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
          <form id="create-job-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Titre du poste *</label>
              <input type="text" required placeholder="Ex: Développeur Front-End React" className={inp} value={formData.titre} onChange={e => setFormData({ ...formData, titre: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type de contrat</label>
                <select className={`${inp} cursor-pointer`} value={formData.typeContrat} onChange={e => setFormData({ ...formData, typeContrat: e.target.value })}>
                  <option value="CDI">CDI</option><option value="CDD">CDD</option><option value="freelance">Freelance</option><option value="stage">Stage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lieu</label>
                <input type="text" placeholder="Ex: Alger (Hybride)" className={inp} value={formData.localisation} onChange={e => setFormData({ ...formData, localisation: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Salaire min (DZD)</label>
                <input type="number" placeholder="Ex: 80000" className={inp} value={formData.salaireMin} onChange={e => setFormData({ ...formData, salaireMin: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-indigo-400" /> Nombre de postes
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="1"
                  className={inp}
                  value={formData.nombrePostes}
                  onChange={e => setFormData({ ...formData, nombrePostes: e.target.value })}
                />
                <p className="text-xs text-slate-400 mt-1">L'offre se fermera automatiquement quand tous les postes sont pourvus.</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description du poste</label>
              <textarea rows="4" placeholder="Décrivez les missions principales…" className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prérequis & Compétences</label>
              <textarea rows="2" placeholder="Ex: React, Node.js, 3 ans d'expérience… (séparés par des virgules)" className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors resize-none" value={formData.requis} onChange={e => setFormData({ ...formData, requis: e.target.value })} />
            </div>
            <FiltresPersonnelsForm value={filtresPersonnels} onChange={setFiltresPersonnels} />
          </form>
        </div>
        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4 rounded-bl-3xl rounded-br-3xl">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Annuler</button>
          <button type="submit" form="create-job-form" disabled={isLoading} className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Publication…</> : <><CheckCircle className="w-5 h-5" /> Publier l'offre</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Planifier Entretien Modal ─────────────────────────────────────────────────
function PlanifierEntretienModal({ isOpen, onClose, candidatureId, candidatName, onSuccess }) {
  const [dateEntretien, setDateEntretien] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  if (!isOpen) return null;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dateEntretien) return setError('Veuillez choisir une date et heure.');
    setLoading(true);
    setError('');
    try {
      await apiFetch(`/api/candidature/${candidatureId}/entretien`, { method: 'POST', body: JSON.stringify({ dateEntretien, feedbackRecruteur: feedback }) });
      onSuccess?.();
      onClose();
      setDateEntretien('');
      setFeedback('');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-500" /> Planifier un entretien</h2>
            <p className="text-sm text-slate-500 mt-1">avec {candidatName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date et heure de l'entretien *</label>
            <input type="datetime-local" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={dateEntretien} min={new Date().toISOString().slice(0,16)} onChange={e => setDateEntretien(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Note / Instructions (optionnel)</label>
            <textarea rows={3} placeholder="Ex: Entretien technique via Google Meet…" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={feedback} onChange={e => setFeedback(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-md">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />} Confirmer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Candidate Profile Modal ───────────────────────────────────────────────────
function CandidateProfileModal({ isOpen, onClose, candidature, onStatusChange }) {
  const navigate = useNavigate();
  const [cv, setCv] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [status, setStatus] = useState(candidature?.etatCandidature || 'Recue');
  const [saving, setSaving] = useState(false);
  const [entretienModal, setEntretienModal] = useState(false);
  const candidat = candidature?.idCandidat || {};

  useEffect(() => {
    if (!isOpen || !candidat._id) return;
    setCvLoading(true);
    apiFetch(`/api/cv/${candidat._id}`)
      .then(data => setCv(data))
      .catch(() => setCv(null))
      .finally(() => setCvLoading(false));
  }, [isOpen, candidat._id]);

  useEffect(() => {
    if (candidature) setStatus(candidature.etatCandidature || 'Recue');
  }, [candidature]);

  if (!isOpen || !candidature) return null;

  const handleStatusChange = async (val) => {
    setSaving(true);
    try {
      await apiFetch(`/api/candidature/${candidature._id}/statut`, { method: 'PATCH', body: JSON.stringify({ etatCandidature: val }) });
      setStatus(val);
      onStatusChange?.(candidature._id, val);
    } catch (e) { alert('Erreur : ' + e.message); } finally { setSaving(false); }
  };

  const s = STATUT_LABEL[status] || STATUT_LABEL.Recue;
  const niveauColor = {
    débutant: 'bg-slate-100 text-slate-600',
    intermédiaire: 'bg-blue-50 text-blue-600',
    avancé: 'bg-indigo-50 text-indigo-600',
    courant: 'bg-green-50 text-green-700',
    natif: 'bg-emerald-50 text-emerald-700'
  };
  const fmt = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '?';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-indigo-50 to-white">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-lg">{candidat.nom?.[0] || candidat.prenom?.[0] || '?'}</div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{candidat.prenom} {candidat.nom}</h2>
                <p className="text-indigo-600 font-semibold">{cv?.titrePoste || 'Candidat'}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                  {candidat.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{candidat.email}</span>}
                  {candidat.telephone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{candidat.telephone}</span>}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                {candidat.bio && (
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><User className="w-3.5 h-3.5" /> À propos</h3>
                    <p className="text-sm text-slate-700">{candidat.bio}</p>
                  </div>
                )}
                {cvLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
                ) : cv ? (
                  <>
                    {cv.competences?.length > 0 && (
                      <div className="bg-white p-5 rounded-2xl shadow-sm">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Code2 className="w-3.5 h-3.5" /> Compétences</h3>
                        <div className="flex flex-wrap gap-2">{cv.competences.map((c,i)=><span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100">{c}</span>)}</div>
                      </div>
                    )}
                    {cv.experiences?.length > 0 && (
                      <div className="bg-white p-5 rounded-2xl shadow-sm">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" /> Expériences</h3>
                        <div className="space-y-4">{cv.experiences.map((exp,i)=><div key={i} className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0"/><div><p className="font-semibold text-slate-800 text-sm">{exp.poste}</p><p className="text-xs text-slate-500">{exp.entreprise}{exp.localisation?` · ${exp.localisation}`:''}</p><p className="text-xs text-slate-400 mt-0.5">{fmt(exp.dateDebut)} — {exp.enCours?'présent':fmt(exp.dateFin)}</p>{exp.description && <p className="text-xs text-slate-600 mt-1">{exp.description}</p>}</div></div>)}</div>
                      </div>
                    )}
                    {cv.formations?.length > 0 && (
                      <div className="bg-white p-5 rounded-2xl shadow-sm">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5" /> Formation</h3>
                        <div className="space-y-3">{cv.formations.map((f,i)=><div key={i} className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2"/><div><p className="font-semibold text-slate-800 text-sm">{f.diplome}{f.domaine?` en ${f.domaine}`:''}</p><p className="text-xs text-slate-500">{f.etablissement}</p><p className="text-xs text-slate-400 mt-0.5">{fmt(f.dateDebut)} — {f.enCours?'en cours':fmt(f.dateFin)}</p></div></div>)}</div>
                      </div>
                    )}
                    {cv.langues?.length > 0 && (
                      <div className="bg-white p-5 rounded-2xl shadow-sm">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Langues</h3>
                        <div className="flex flex-wrap gap-2">{cv.langues.map((l,i)=><span key={i} className={`px-3 py-1 rounded-lg text-xs font-medium ${niveauColor[l.niveau] || 'bg-slate-100 text-slate-600'}`}>{l.langue} · {l.niveau}</span>)}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white p-5 rounded-2xl border border-dashed text-center text-slate-400"><FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" /> Aucun CV renseigné</div>
                )}
              </div>
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Statut candidature</h3>
                  <select value={status} disabled={saving} onChange={e=>handleStatusChange(e.target.value)} className={`w-full px-4 py-3 rounded-xl border-2 font-bold outline-none cursor-pointer transition-colors text-sm ${s.color}`}>
                    {STATUTS.map(st=><option key={st} value={st}>{STATUT_LABEL[st].label}</option>)}
                  </select>
                  {saving && <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Mise à jour…</p>}
                </div>
                {candidature.matchScore != null && (
                  <div className="bg-white p-5 rounded-2xl shadow-sm text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Score IA</p>
                    <ScoreBadge score={candidature.matchScore} />
                    <p className="text-xs text-slate-400 mt-1">{candidature.typePostulation === 'matching' ? 'Via matching IA' : 'Candidature manuelle'}</p>
                  </div>
                )}
                {candidature.entretien?.dateEntretien && (
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Entretien planifié</p>
                    <p className="text-sm font-semibold text-blue-800">{new Date(candidature.entretien.dateEntretien).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}</p>
                    {candidature.entretien.feedbackRecruteur && <p className="text-xs text-blue-600 mt-1 italic">"{candidature.entretien.feedbackRecruteur}"</p>}
                  </div>
                )}
                <div className="space-y-2">
                  <button onClick={()=>setEntretienModal(true)} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-md text-sm">
                    <Calendar className="w-4 h-4" /> {candidature.entretien?.dateEntretien ? "Modifier l'entretien" : 'Planifier un entretien'}
                  </button>
                  <button onClick={()=>navigate(`/user/${candidat._id}`)} className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl font-semibold transition-all text-sm">
                    <ExternalLink className="w-4 h-4" /> Voir le profil public
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PlanifierEntretienModal isOpen={entretienModal} onClose={()=>setEntretienModal(false)} candidatureId={candidature._id} candidatName={`${candidat.prenom||''} ${candidat.nom||''}`.trim()} onSuccess={()=>{handleStatusChange('convocationEntretien'); setEntretienModal(false);}} />
    </>
  );
}

// ── Candidate Row ─────────────────────────────────────────────────────────────
function CandidateRow({ cand, onStatusChange, onOpenProfile, onOfferClosed }) {
  const [status, setStatus] = useState(cand.etatCandidature || 'Recue');
  const [saving, setSaving] = useState(false);
  const s = STATUT_LABEL[status] || STATUT_LABEL.Recue;

  const handleChange = async (val) => {
    setSaving(true);
    try {
      await apiFetch(`/api/candidature/${cand._id}/statut`, { method: 'PATCH', body: JSON.stringify({ etatCandidature: val }) });
      setStatus(val);
      onStatusChange?.(cand._id, val);

      if (val === 'Embauchee') {
        const offreId = cand.idOffre?._id || cand.idOffre;
        if (offreId) {
          const offreData = await apiFetch(`/api/offre/${offreId}`).catch(() => null);
          const nombrePostes = offreData?.nombrePostes || 1;
          const toutesLesCandidat = await apiFetch(`/api/candidature/offre/${offreId}`).catch(() => []);
          const nbEmbauches = toutesLesCandidat.filter(
            c => c._id === cand._id ? true : c.etatCandidature === 'Embauchee'
          ).length;

          if (nbEmbauches >= nombrePostes) {
            await apiFetch(`/api/offre/${offreId}`, { method: 'PUT', body: JSON.stringify({ statutOffre: 'fermer' }) });
            for (let autre of toutesLesCandidat) {
              if (autre._id !== cand._id && autre.etatCandidature !== 'Embauchee') {
                await notifyCandidat(
                  autre.idCandidat._id || autre.idCandidat,
                  `L'offre "${offreData?.titre || cand.idOffre?.titre || 'cette offre'}" a été pourvue (${nombrePostes} poste${nombrePostes > 1 ? 's' : ''} comblé${nombrePostes > 1 ? 's' : ''}). Votre candidature est malheureusement annulée.`,
                  autre._id
                );
              }
            }
            onOfferClosed?.(offreId);
            toast.success(`Tous les postes sont pourvus — offre fermée. ${cand.idCandidat?.prenom} embauché(e).`);
          } else {
            const restants = nombrePostes - nbEmbauches;
            toast.success(`${cand.idCandidat?.prenom} embauché(e). ${restants} poste${restants > 1 ? 's' : ''} encore disponible${restants > 1 ? 's' : ''}.`);
          }
        }
      }
    } catch (e) { toast.error('Erreur : ' + e.message); } finally { setSaving(false); }
  };
  const c = cand.idCandidat || {};
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-all group">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">{c.nom?.[0] || c.prenom?.[0] || '?'}</div>
      <div className="flex-1 min-w-0"><p className="font-semibold text-slate-800 truncate">{c.prenom || ''} {c.nom || ''}</p><p className="text-xs text-slate-400 truncate">{c.email}</p></div>
      <div className="flex items-center gap-2 shrink-0">
        {cand.matchScore != null && <ScoreBadge score={cand.matchScore} />}
        <select value={status} disabled={saving} onChange={e => handleChange(e.target.value)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border outline-none cursor-pointer transition-all ${s.color}`}>
          {STATUTS.map(st => <option key={st} value={st}>{STATUT_LABEL[st].label}</option>)}
        </select>
        <button onClick={() => onOpenProfile(cand)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50" title="Voir le profil"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

// ── Offer Accordion ───────────────────────────────────────────────────────────
function OfferAccordion({ offre, onDeleted, onUpdated, onOfferClosed }) {
  const [open, setOpen] = useState(false);
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedCandidature, setSelectedCandidature] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const toggle = async () => {
    if (!open && !loaded) {
      setLoading(true);
      try {
        const data = await apiFetch(`/api/candidature/offre/${offre._id}`);
        setCandidatures(data);
        setLoaded(true);
      } catch (error) { console.error(error); } finally { setLoading(false); }
    }
    setOpen(v => !v);
  };
  const openProfile = (cand) => { setSelectedCandidature({ ...cand, idOffre: offre }); setModalOpen(true); };
  const handleDelete = async () => {
    if (!confirm('Supprimer cette offre ?')) return;
    try { await apiFetch(`/api/offre/${offre._id}`, { method: 'DELETE' }); onDeleted(offre._id); } catch(e){toast.error(e.message);}
  };
  const handleStatusChange = (candId, newStatus) => {
    setCandidatures(prev=>prev.map(c=>c._id===candId?{...c, etatCandidature:newStatus}:c));
    if(selectedCandidature?._id===candId) setSelectedCandidature(prev=>({...prev, etatCandidature:newStatus}));
  };
  const handleEditSave = async (offreId, payload) => {
    await apiFetch(`/api/offre/${offreId}`, { method: 'PUT', body: JSON.stringify(payload) });
    if(onUpdated) onUpdated();
  };
  const hasApplicants = (offre.applicantCount && offre.applicantCount > 0) || candidatures.length > 0;
  const isClosed = offre.statutOffre === 'fermer';
  const nombrePostes = offre.nombrePostes || 1;
  const nbEmbauches = candidatures.filter(c => c.etatCandidature === 'Embauchee').length;
  const restants = Math.max(0, nombrePostes - nbEmbauches);

  return (
    <>
      <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all ${isClosed ? 'border-slate-200 bg-slate-50/30' : 'border-slate-200'}`}>
        <div className="flex items-center p-5 gap-4 cursor-pointer group" onClick={toggle}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-bold ${isClosed ? 'text-slate-600' : 'text-slate-800'} group-hover:text-indigo-600 transition-colors`}>{offre.titre}</h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isClosed ? 'bg-slate-200 text-slate-600' : offre.statutOffre === 'ouvert' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {isClosed ? 'Fermée' : offre.statutOffre === 'ouvert' ? 'Active' : 'Fermée'}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 flex items-center gap-1">
                <Hash className="w-2.5 h-2.5" />
                {nombrePostes} poste{nombrePostes > 1 ? 's' : ''}
                {loaded && ` · ${restants} libre${restants > 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              {offre.localisation && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{offre.localisation}</span>}
              {offre.typeContrat && <span className={`px-2 py-0.5 rounded-md font-semibold ${CONTRACT_COLOR[offre.typeContrat] || 'bg-slate-50 text-slate-500'}`}>{offre.typeContrat}</span>}
              <span className="text-slate-400"><Calendar className="w-3 h-3 inline mr-1" />{new Date(offre.datePublication).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center"><div className="text-lg font-black text-indigo-700">{offre.applicantCount ?? '—'}</div><div className="text-[10px] text-slate-400 font-semibold">Candidats</div></div>
            <button onClick={e=>{ e.stopPropagation(); setEditModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors" title="Modifier"><Settings className="w-4 h-4" /></button>
            {!hasApplicants && !isClosed && <button onClick={e=>{ e.stopPropagation(); handleDelete(); }} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Supprimer"><Trash2 className="w-4 h-4" /></button>}
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>
        {open && (
          <div className="border-t border-slate-100">
            {loading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-indigo-400" /></div> : candidatures.length === 0 ? <div className="text-center py-8 text-slate-400 text-sm">Aucune candidature</div> : (
              <div className="p-3 space-y-1">
                <div className="px-4 pt-2 pb-1 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{candidatures.length} candidature{candidatures.length>1?'s':''}</p>
                  {nombrePostes > 1 && (
                    <p className="text-xs text-indigo-600 font-semibold">
                      {nbEmbauches}/{nombrePostes} poste{nombrePostes > 1 ? 's' : ''} pourvus
                    </p>
                  )}
                </div>
                {candidatures.map(c=><CandidateRow key={c._id} cand={c} onOpenProfile={openProfile} onStatusChange={handleStatusChange} onOfferClosed={onOfferClosed} />)}
              </div>
            )}
          </div>
        )}
      </div>
      <CandidateProfileModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} candidature={selectedCandidature} onStatusChange={handleStatusChange} />
      <EditJobModal isOpen={editModalOpen} onClose={()=>setEditModalOpen(false)} offre={offre} onSave={handleEditSave} />
    </>
  );
}

// ── Interview Calendar ───────────────────────────────────────────────────────
function InterviewCalendar({ entretiens, loading }) {
  const today = new Date();
  const [viewYear, setViewYear] = React.useState(today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(today.getMonth());
  const [selectedDay, setSelectedDay] = React.useState(null);
  if(loading) return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;
  const byDay = {};
  entretiens.forEach(e => { const d = new Date(e.entretien.dateEntretien); const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; if(!byDay[key]) byDay[key] = []; byDay[key].push(e); });
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = []; for(let i=0;i<firstDow;i++) cells.push(null); for(let d=1;d<=daysInMonth;d++) cells.push(d);
  const prevMonth = () => { if(viewMonth===0){setViewYear(y=>y-1);setViewMonth(11);}else setViewMonth(m=>m-1); setSelectedDay(null); };
  const nextMonth = () => { if(viewMonth===11){setViewYear(y=>y+1);setViewMonth(0);}else setViewMonth(m=>m+1); setSelectedDay(null); };
  const dayKey = (d) => d ? `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` : '';
  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const selectedEvents = selectedDay ? (byDay[dayKey(selectedDay)] || []) : [];
  const formatTime = (dt) => new Date(dt).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-white/80 text-slate-500 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <h3 className="text-lg font-bold text-slate-800 capitalize flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-500" />{monthLabel}</h3>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-white/80 text-slate-500 transition-colors"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
          {DAYS.map(d=> <div key={d} className="py-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wide">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            const key = dayKey(day); const events = day ? (byDay[key] || []) : []; const isToday = key === todayKey; const isSelected = key !== '' && key === dayKey(selectedDay);
            return (
              <div key={idx} onClick={() => day && setSelectedDay(isSelected ? null : day)} className={`min-h-[80px] p-2 border-b border-r border-slate-50 transition-all relative ${day ? 'cursor-pointer hover:bg-indigo-50' : ''} ${isSelected ? 'bg-indigo-100 ring-2 ring-inset ring-indigo-300' : ''} ${idx%7===6 ? 'border-r-0' : ''}`}>
                {day && (
                  <>
                    <span className={`inline-flex items-center justify-center w-7 h-7 text-sm font-bold rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700'}`}>{day}</span>
                    {events.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {events.slice(0,2).map((e,i)=><div key={i} className="text-[10px] font-semibold bg-indigo-200 text-indigo-800 rounded px-1 truncate leading-4">{formatTime(e.entretien.dateEntretien)} {e.idCandidat?.prenom||''}</div>)}
                        {events.length > 2 && <div className="text-[10px] text-indigo-600 font-bold">+{events.length-2}</div>}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {selectedDay && (
        <div className="bg-white rounded-3xl border border-indigo-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-indigo-50/50"><h3 className="font-bold text-indigo-800">Entretiens du {new Date(viewYear, viewMonth, selectedDay).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</h3></div>
          {selectedEvents.length === 0 ? <div className="p-8 text-center text-slate-400">Aucun entretien ce jour.</div> : <div className="divide-y divide-slate-100">{selectedEvents.map(e=>{ const c=e.idCandidat||{}; const offre=e.idOffre||{}; return <div key={e._id} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50"><div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">{formatTime(e.entretien.dateEntretien)}</div><div className="flex-1"><p className="font-bold text-slate-800">{c.prenom||''} {c.nom||''}</p><p className="text-sm text-slate-500">{offre.titre||'Offre'}</p><p className="text-xs text-slate-400 mt-0.5">{c.email}</p>{e.entretien.feedbackRecruteur && <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg italic">"{e.entretien.feedbackRecruteur}"</p>}</div><span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700">Entretien</span></div>})}</div>}
        </div>
      )}
      {entretiens.length === 0 && <div className="bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center py-20 text-slate-400 gap-3"><CalendarDays className="w-12 h-12 text-slate-300" /><p>Aucun entretien planifié</p></div>}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};

  const [activeTab, setActiveTab] = useState('overview');
  const [offres, setOffres] = useState([]);
  const [offresLoading, setOffresLoading] = useState(false);
  const [entretiens, setEntretiens] = useState([]);
  const [entretiensLoading, setEntretiensLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const notifRef = useRef(null);

  const [filterStatut, setFilterStatut] = useState('toutes');
  const [sortBy, setSortBy] = useState('date_desc');
  const filteredSortedOffres = React.useMemo(() => {
    let result = [...offres];
    if(filterStatut === 'actives') result = result.filter(o=>o.statutOffre==='ouvert');
    if(filterStatut === 'fermees') result = result.filter(o=>o.statutOffre==='fermer');
    if(sortBy === 'date_desc') result.sort((a,b)=>new Date(b.datePublication)-new Date(a.datePublication));
    if(sortBy === 'date_asc') result.sort((a,b)=>new Date(a.datePublication)-new Date(b.datePublication));
    if(sortBy === 'candidats_desc') result.sort((a,b)=>(b.applicantCount||0)-(a.applicantCount||0));
    return result;
  }, [offres, filterStatut, sortBy]);

  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileForm, setProfileForm] = useState(null);

  const stats = {
    offresActives: offres.filter(o=>o.statutOffre==='ouvert').length,
    totalCandidatures: offres.reduce((s,o)=>s+(o.applicantCount||0),0),
    entretiensAVenir: entretiens.filter(e=>new Date(e.entretien?.dateEntretien)>=new Date()).length
  };

  useEffect(()=>{
    const h = e => { if(notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const loadOffres = useCallback(async()=>{
    setOffresLoading(true);
    try {
      const data = await apiFetch('/api/offre/mes-offres');
      const withCounts = await Promise.all((data||[]).map(async o=>({
        ...o,
        applicantCount: await apiFetch(`/api/candidature/offre/${o._id}`).then(c=>c.length).catch(() => 0)
      })));
      setOffres(withCounts);
    } catch (error) { console.error(error); } finally { setOffresLoading(false); }
  }, []);

  const loadEntretiens = useCallback(async()=>{
    setEntretiensLoading(true);
    try {
      const data = await apiFetch('/api/candidature/entretiens');
      setEntretiens(data||[]);
    } catch (error) { console.error(error); } finally { setEntretiensLoading(false); }
  }, []);

  const loadNotifications = useCallback(async()=>{
    try {
      const data = await apiFetch('/api/notification');
      setNotifications(data||[]);
    } catch (error) { console.error(error); }
  }, []);

  useEffect(()=>{ loadOffres(); loadNotifications(); loadEntretiens(); }, [loadOffres, loadNotifications, loadEntretiens]);

  useEffect(()=>{
    if(activeTab !== 'settings' || profileData) return;
    setProfileLoading(true);
    authService.getMe()
      .then(data => {
        setProfileData(data);
        setProfileForm({
          nomEntreprise: data.nomEntreprise || '',
          descriptionEntreprise: data.descriptionEntreprise || '',
          secteurActivite: data.secteurActivite || '',
          telephone: data.telephone || '',
          adresse: {
            numeroRue: data.adresse?.numeroRue || '',
            nomRue: data.adresse?.nomRue || '',
            codePostal: data.adresse?.codePostal || '',
            ville: data.adresse?.ville || '',
            region: data.adresse?.region || '',
            pays: data.adresse?.pays || '',
          }
        });
      })
      .catch(() => setProfileError('Impossible de charger le profil.'))
      .finally(() => setProfileLoading(false));
  }, [activeTab, profileData]);

  const markAllRead = async() => {
    try {
      await apiFetch('/api/notification/read-all', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
    } catch (error) { console.error(error); }
  };

  const unread = notifications.filter(n => !n.lu).length;
  const handleJobCreated = () => {
    setIsJobModalOpen(false);
    loadOffres(); // ← recharge forcée après création
  };
  const handleOfferDeleted = (id) => setOffres(prev => prev.filter(o => o._id !== id));
  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Offres actives', value: stats.offresActives, sub: `sur ${offres.length} total` },
          { title: 'Candidatures reçues', value: stats.totalCandidatures, sub: 'toutes offres' },
          { title: 'Entretiens à venir', value: stats.entretiensAVenir, sub: 'prochains rendez-vous' }
        ].map((s,i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Briefcase className="w-6 h-6" /></div>
            <div><p className="text-sm font-medium text-slate-500">{s.title}</p><h3 className="text-3xl font-black text-slate-800">{s.value}</h3><p className="text-xs text-slate-400">{s.sub}</p></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Offres récentes</h3>
          <button onClick={() => setActiveTab('jobs')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">Voir tout <ChevronRight className="w-4 h-4" /></button>
        </div>
        {offresLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>
        ) : offres.length === 0 ? (
          <div className="text-center py-12 text-slate-400"><Briefcase className="w-10 h-10 mx-auto mb-3 text-slate-300" />Aucune offre publiée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-sm border-b">
                <tr>
                  <th className="font-medium py-3 px-6">Poste</th>
                  <th className="font-medium py-3 px-6 text-center">Postes</th>
                  <th className="font-medium py-3 px-6 text-center">Candidats</th>
                  <th className="font-medium py-3 px-6">Statut</th>
                </tr>
              </thead>
              <tbody>
                {offres.slice(0,4).map(o => (
                  <tr key={o._id} className="border-b hover:bg-slate-50">
                    <td className="py-4 px-6"><p className="font-bold text-slate-800">{o.titre}</p>{o.localisation && <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{o.localisation}</p>}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center bg-indigo-50 text-indigo-600 font-bold text-xs px-2 py-1 rounded-full gap-1">
                        <Hash className="w-3 h-3" />{o.nombrePostes || 1}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center"><span className="inline-flex items-center justify-center bg-indigo-100 text-indigo-700 font-bold text-sm px-3 py-1 rounded-full">{o.applicantCount??0}</span></td>
                    <td className="py-4 px-6"><span className={`text-xs font-bold px-3 py-1 rounded-full ${o.statutOffre==='ouvert'?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-500'}`}>{o.statutOffre==='ouvert'?'Active':'Fermée'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Prochains entretiens</h3>
          <button onClick={() => setActiveTab('calendar')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Voir calendrier</button>
        </div>
        <div className="p-4 space-y-3">
          {entretiens.filter(e => new Date(e.entretien?.dateEntretien) >= new Date()).slice(0,3).map(e => {
            const c = e.idCandidat || {};
            const offre = e.idOffre || {};
            return (
              <div key={e._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">{c.nom?.[0] || '?'}</div>
                <div className="flex-1"><p className="font-semibold">{c.prenom} {c.nom}</p><p className="text-xs text-slate-500">{offre.titre}</p></div>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">{new Date(e.entretien.dateEntretien).toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
              </div>
            );
          })}
          {entretiens.filter(e => new Date(e.entretien?.dateEntretien) >= new Date()).length === 0 && (
            <p className="text-center text-slate-400 py-4">Aucun entretien à venir.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderJobs = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div><h2 className="text-2xl font-bold text-slate-800">Mes offres & candidats</h2><p className="text-slate-500 text-sm mt-1">Cliquez sur une offre pour voir ses candidats.</p></div>
        <div className="flex gap-2">
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm">
            <option value="toutes">Toutes les offres</option>
            <option value="actives">Offres actives</option>
            <option value="fermees">Offres fermées</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm">
            <option value="date_desc">Date récente → ancienne</option>
            <option value="date_asc">Date ancienne → récente</option>
            <option value="candidats_desc">Candidats (décroissant)</option>
          </select>
          <button onClick={() => setIsJobModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all"><Plus className="w-5 h-5" /> Créer une offre</button>
        </div>
      </div>
      {offresLoading ? (
        <div className="flex justify-center h-48"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
      ) : filteredSortedOffres.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center py-20 text-slate-400 gap-3"><Briefcase className="w-12 h-12 text-slate-300" /><p>Aucune offre trouvée.</p></div>
      ) : (
        <div className="space-y-4">
          {filteredSortedOffres.map(o => <OfferAccordion key={o._id} offre={o} onDeleted={handleOfferDeleted} onUpdated={loadOffres} onOfferClosed={loadOffres} />)}
        </div>
      )}
    </div>
  );

  const renderCalendar = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-slate-800">Calendrier des entretiens</h2><p className="text-slate-500 text-sm mt-1">Tous vos entretiens planifiés, triés chronologiquement.</p></div>
        <button onClick={loadEntretiens} disabled={entretiensLoading} className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${entretiensLoading ? 'animate-spin' : ''}`} /> Actualiser</button>
      </div>
      <InterviewCalendar entretiens={entretiens} loading={entretiensLoading} />
    </div>
  );

  const renderSettings = () => {
    const inp = "w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors";
    const handleSave = async () => {
      setProfileSaving(true);
      setProfileError('');
      setProfileSuccess('');
      try {
        await authService.updateProfile(profileForm);
        const updated = await authService.getMe();
        setProfileData(updated);
        localStorage.setItem('user', JSON.stringify({
          ...JSON.parse(localStorage.getItem('user') || '{}'),
          nomEntreprise: updated.nomEntreprise,
          secteurActivite: updated.secteurActivite,
        }));
        setProfileSuccess('Profil mis à jour avec succès.');
      } catch(e) {
        setProfileError(e?.response?.data?.error || 'Erreur lors de la sauvegarde.');
      } finally {
        setProfileSaving(false);
      }
    };
    const setField = (k,v) => setProfileForm(prev => ({ ...prev, [k]: v }));
    const setAdresse = (k,v) => setProfileForm(prev => ({ ...prev, adresse: { ...prev.adresse, [k]: v } }));
    if (profileLoading || !profileForm) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;
    return (
      <div className="space-y-8 max-w-3xl mx-auto pb-10">
        <div><h2 className="text-2xl font-bold text-slate-800">Paramètres du compte</h2><p className="text-slate-500 text-sm mt-1">Gérez les informations de votre entreprise.</p></div>
        <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-md">{(profileData?.nomEntreprise||profileData?.email||'R')[0].toUpperCase()}</div>
          <div className="flex-1"><p className="font-bold text-slate-900 text-lg">{profileData?.nomEntreprise||'—'}</p><p className="text-slate-500 text-sm">{profileData?.email}</p><div className="flex flex-wrap gap-2 mt-2"><span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${profileData?.etatValidation==='valideParAdmin'?'bg-emerald-100 text-emerald-700 border-emerald-200':'bg-amber-100 text-amber-700 border-amber-200'}`}>{profileData?.etatValidation==='valideParAdmin'?'✓ Validé':profileData?.etatValidation==='enAttente'?'⏳ En attente':profileData?.etatValidation==='valideParIA'?'🤖 IA validé':profileData?.etatValidation==='refuse'?'✗ Refusé':'Non vérifié'}</span>{profileData?.createdAt && <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> Membre depuis {new Date(profileData.createdAt).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</span>}</div>{profileData?.id && <button onClick={()=>navigate(`/recruteur/${profileData.id}`)} className="mt-3 text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline"><ExternalLink className="w-3 h-3" /> Voir mon profil public</button>}</div>
        </div>
        {profileError && <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm">{profileError}</div>}
        {profileSuccess && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-sm">{profileSuccess}</div>}
        <div className="bg-white p-8 rounded-3xl border shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6"><Building className="w-5 h-5 text-indigo-600" /> Informations de l'entreprise</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className="block text-sm font-medium mb-2">Nom de l'entreprise</label><input type="text" className={inp} value={profileForm.nomEntreprise} onChange={e=>setField('nomEntreprise',e.target.value)} /></div>
            <div><label className="block text-sm font-medium mb-2">Secteur d'activité</label><input type="text" className={inp} value={profileForm.secteurActivite} onChange={e=>setField('secteurActivite',e.target.value)} /></div>
            <div><label className="block text-sm font-medium mb-2 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> Téléphone</label><input type="text" className={inp} value={profileForm.telephone} onChange={e=>setField('telephone',e.target.value)} /></div>
            <div><label className="block text-sm font-medium mb-2 flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> Email (non modifiable)</label><input type="email" disabled value={profileData?.email||''} className="w-full px-4 py-3 rounded-xl border bg-slate-100 text-slate-400" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium mb-2">Description de l'entreprise</label><textarea rows={4} className={`${inp} resize-none`} value={profileForm.descriptionEntreprise} onChange={e=>setField('descriptionEntreprise',e.target.value)} /></div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6"><MapPin className="w-5 h-5 text-indigo-600" /> Adresse</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {['numeroRue','nomRue','codePostal','ville','region','pays'].map(key => (
              <div key={key}>
                <label className="block text-sm font-medium mb-2">{key==='numeroRue'?'Numéro':key==='nomRue'?'Rue':key==='codePostal'?'Code postal':key==='ville'?'Ville':key==='region'?'Région':'Pays'}</label>
                <input type="text" className={inp} value={profileForm.adresse[key]} onChange={e=>setAdresse(key,e.target.value)} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={profileSaving} className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md ${profileSaving?'bg-indigo-400 cursor-not-allowed':'bg-indigo-600 hover:bg-indigo-700'}`}>
            {profileSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde…</> : <><Save className="w-4 h-4" /> Sauvegarder</>}
          </button>
        </div>
      </div>
    );
  };

  const TAB_LABELS = {
    overview: `Bonjour, ${user.nomEntreprise || 'Recruteur'} 👋`,
    jobs: 'Offres & Candidats',
    calendar: 'Calendrier des entretiens',
    settings: 'Paramètres'
  };
  const navItems = [
    { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: 'jobs', label: 'Offres & Candidats', icon: Briefcase },
    { id: 'calendar', label: 'Calendrier', icon: CalendarDays }
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-slate-100 cursor-pointer" onClick={()=>navigate('/')}>
          <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">MatchTalent.</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Menu</p>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={()=>setActiveTab(id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab===id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Icon className={`w-5 h-5 ${activeTab===id?'text-indigo-600':'text-slate-400'}`} /> {label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 space-y-1">
          <button onClick={()=>setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab==='settings'?'bg-indigo-50 text-indigo-700':'text-slate-600 hover:bg-slate-50'}`}><Settings className="w-5 h-5" /> Paramètres</button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors"><LogOut className="w-5 h-5" /> Déconnexion</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <h2 className="text-xl font-bold text-slate-800">{TAB_LABELS[activeTab] || ''}</h2>
          <div className="flex items-center gap-4">
            <div className="relative" ref={notifRef}>
              <button onClick={()=>setNotifOpen(v=>!v)} className={`relative p-2 rounded-full transition-all ${notifOpen?'bg-indigo-50 text-indigo-600':'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'}`}><Bell className="w-6 h-6" />{unread>0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}</button>
              {notifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  <div className="p-4 border-b flex justify-between items-center bg-slate-50/50"><h3 className="font-bold">Notifications</h3>{unread>0 && <button onClick={markAllRead} className="text-xs text-indigo-600 font-semibold flex items-center gap-1"><CheckCheck className="w-3.5 h-3.5" /> Tout lu</button>}</div>
                  <div className="max-h-72 overflow-y-auto divide-y">
                    {notifications.length===0?<p className="p-4 text-center text-slate-400">Aucune notification</p>:notifications.slice(0,8).map(n=>(
                      <div key={n._id} className={`p-4 flex gap-3 ${!n.lu?'bg-indigo-50/30':''}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.lu?'bg-indigo-600':'bg-transparent'}`}/>
                        <div><p className={`text-sm ${!n.lu?'font-semibold text-slate-800':'text-slate-600'}`}>{n.contenu}</p><p className="text-xs text-slate-400 mt-1">{new Date(n.dateEnvoi).toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p></div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t text-center hover:bg-slate-50 cursor-pointer" onClick={()=>setNotifOpen(false)}><span className="text-sm text-indigo-600 font-bold">Fermer</span></div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">{(user.nomEntreprise||user.email||'R')[0].toUpperCase()}</div>
              <div className="hidden sm:block"><p className="text-sm font-semibold text-slate-800 truncate max-w-[120px]">{user.nomEntreprise||'Recruteur'}</p><p className="text-xs text-slate-400 truncate">{user.email}</p></div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'jobs' && renderJobs()}
            {activeTab === 'calendar' && renderCalendar()}
            {activeTab === 'settings' && renderSettings()}
          </div>
        </div>
      </main>
      <CreateJobModal isOpen={isJobModalOpen} onClose={()=>setIsJobModalOpen(false)} onSuccess={handleJobCreated} />
    </div>
  );
}