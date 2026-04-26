import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, CalendarDays, Settings, LogOut,
  Bell, Plus, MapPin, Clock, ChevronRight, ChevronDown,
  Loader2, CheckCircle, XCircle, AlertCircle, Star,
  Trash2, CheckCheck, RefreshCw, X, Save, Users,
  Building, Calendar, Mail, Phone, User, Code2,
  GraduationCap, Globe, Heart, FileText, ExternalLink,
} from 'lucide-react';
import FiltresPersonnelsForm from './Filtrespersonnelsform';

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

// ── Status helpers ───────────────────────────────────────────────────────────
const STATUTS = ['Recue', 'demandeDocSupp', 'convocationEntretien', 'Embauchee', 'refusee'];
const STATUT_LABEL = {
  Recue:                { label: 'Reçue',        color: 'bg-slate-100 text-slate-600'   },
  demandeDocSupp:       { label: 'Docs requis',  color: 'bg-amber-50 text-amber-700'    },
  convocationEntretien: { label: 'Entretien',    color: 'bg-blue-50 text-blue-700'      },
  Embauchee:            { label: 'Embauché(e)',  color: 'bg-green-50 text-green-700'    },
  refusee:              { label: 'Refusé(e)',    color: 'bg-red-50 text-red-600'        },
};
const CONTRACT_COLOR = {
  CDI:       'bg-blue-50 text-blue-700 border-blue-100',
  CDD:       'bg-amber-50 text-amber-700 border-amber-100',
  stage:     'bg-indigo-50 text-indigo-700 border-indigo-100',
  freelance: 'bg-purple-50 text-purple-700 border-purple-100',
};

function ScoreBadge({ score }) {
  if (score == null) return null;
  const color = score >= 80 ? 'text-green-700 bg-green-50 border-green-200'
              : score >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200'
              :               'text-red-600 bg-red-50 border-red-200';
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${color}`}>
      IA {score}%
    </span>
  );
}

// ── Create Job Modal ──────────────────────────────────────────────────────────
function CreateJobModal({ isOpen, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    titre: '', typeContrat: 'CDI', localisation: '',
    salaireMin: '', salaireMax: '', description: '', requis: '',
  });
  const [filtresPersonnels, setFiltresPersonnels] = useState({ ageMin: null, ageMax: null, genres: [] });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim()) return setError('Le titre est requis.');
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
      };
      await apiFetch('/api/offre', { method: 'POST', body: JSON.stringify(payload) });
      onSuccess?.();
      onClose();
      setFormData({ titre: '', typeContrat: 'CDI', localisation: '', salaireMin: '', salaireMax: '', description: '', requis: '' });
      setFiltresPersonnels({ ageMin: null, ageMax: null, genres: [] });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inp = "w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Créer une nouvelle offre</h2>
            <p className="text-sm text-slate-500 mt-1">Remplissez les détails pour publier votre annonce.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}
          <form id="create-job-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Titre du poste *</label>
              <input type="text" required placeholder="Ex: Développeur Front-End React"
                className={inp} value={formData.titre}
                onChange={e => setFormData({ ...formData, titre: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type de contrat</label>
                <select className={`${inp} cursor-pointer`} value={formData.typeContrat}
                  onChange={e => setFormData({ ...formData, typeContrat: e.target.value })}>
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="freelance">Freelance</option>
                  <option value="stage">Stage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lieu</label>
                <input type="text" placeholder="Ex: Alger (Hybride)" className={inp}
                  value={formData.localisation}
                  onChange={e => setFormData({ ...formData, localisation: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Salaire min (DZD)</label>
                <input type="number" placeholder="Ex: 80000" className={inp}
                  value={formData.salaireMin}
                  onChange={e => setFormData({ ...formData, salaireMin: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description du poste</label>
              <textarea rows="4" placeholder="Décrivez les missions principales…"
                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors resize-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prérequis & Compétences</label>
              <textarea rows="2" placeholder="Ex: React, Node.js, 3 ans d'expérience… (séparés par des virgules)"
                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors resize-none"
                value={formData.requis}
                onChange={e => setFormData({ ...formData, requis: e.target.value })} />
            </div>
            <FiltresPersonnelsForm value={filtresPersonnels} onChange={setFiltresPersonnels} />
          </form>
        </div>

        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
          <button type="button" onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">
            Annuler
          </button>
          <button type="submit" form="create-job-form" disabled={isLoading}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all ${
              isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'
            }`}>
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
      await apiFetch(`/api/candidature/${candidatureId}/entretien`, {
        method: 'POST',
        body: JSON.stringify({ dateEntretien, feedbackRecruteur: feedback }),
      });
      onSuccess?.();
      onClose();
      setDateEntretien('');
      setFeedback('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Planifier un entretien</h2>
            <p className="text-sm text-slate-500 mt-1">avec {candidatName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" /> Date et heure de l'entretien *
            </label>
            <input type="datetime-local" required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700"
              value={dateEntretien}
              min={new Date().toISOString().slice(0, 16)}
              onChange={e => setDateEntretien(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Note / Instructions (optionnel)</label>
            <textarea rows={3} placeholder="Ex: Entretien technique via Google Meet…"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 resize-none"
              value={feedback} onChange={e => setFeedback(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-lg shadow-indigo-200">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              Confirmer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Candidate Profile Modal (with real CV data) ───────────────────────────────
function CandidateProfileModal({ isOpen, onClose, candidature, onStatusChange }) {
  const navigate = useNavigate();
  const [cv, setCv] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [status, setStatus] = useState(candidature?.etatCandidature || 'Recue');
  const [saving, setSaving] = useState(false);
  const [entretienModal, setEntretienModal] = useState(false);

  const candidat = candidature?.idCandidat || {};
  const offre = candidature?.idOffre || {};

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
      await apiFetch(`/api/candidature/${candidature._id}/statut`, {
        method: 'PATCH',
        body: JSON.stringify({ etatCandidature: val }),
      });
      setStatus(val);
      onStatusChange?.(candidature._id, val);
    } catch (e) {
      alert('Erreur : ' + e.message);
    } finally { setSaving(false); }
  };

  const s = STATUT_LABEL[status] || STATUT_LABEL.Recue;

  const niveauColor = {
    débutant: 'bg-slate-100 text-slate-600',
    intermédiaire: 'bg-blue-50 text-blue-600',
    avancé: 'bg-indigo-50 text-indigo-600',
    courant: 'bg-green-50 text-green-700',
    natif: 'bg-emerald-50 text-emerald-700',
  };

  const fmt = (dateStr) => {
    if (!dateStr) return '?';
    return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  };

  const genreLabel = { homme: 'Homme', femme: 'Femme', nonSpecifie: 'Non précisé' };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-50 pointer-events-none" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-black shadow-inner shrink-0">
                {candidat.nom?.[0] || candidat.prenom?.[0] || '?'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{candidat.prenom} {candidat.nom}</h2>
                <p className="text-indigo-600 font-semibold">{cv?.titrePoste || 'Candidat'}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                  {candidat.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{candidat.email}</span>}
                  {candidat.telephone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{candidat.telephone}</span>}
                </div>
                {/* Personal info row */}
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  {candidat.genre && candidat.genre !== 'nonSpecifie' && (
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md">{genreLabel[candidat.genre] || candidat.genre}</span>
                  )}
                  {candidat.dateNaissance && (
                    <span>Né(e) le {new Date(candidat.dateNaissance).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full relative z-10">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* LEFT: CV */}
              <div className="lg:col-span-2 space-y-5">
                {/* Bio */}
                {candidat.bio && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> À propos
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{candidat.bio}</p>
                  </div>
                )}

                {cvLoading ? (
                  <div className="flex items-center justify-center h-32 bg-white rounded-2xl border border-slate-100">
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                  </div>
                ) : cv ? (
                  <>
                    {/* Compétences */}
                    {cv.competences?.length > 0 && (
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Code2 className="w-3.5 h-3.5" /> Compétences
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {cv.competences.map((c, i) => (
                            <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expériences */}
                    {cv.experiences?.length > 0 && (
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5" /> Expériences
                        </h3>
                        <div className="space-y-4">
                          {cv.experiences.map((exp, i) => (
                            <div key={i} className="flex gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                              <div>
                                <p className="font-semibold text-slate-800 text-sm">{exp.poste}</p>
                                <p className="text-xs text-slate-500">{exp.entreprise}{exp.localisation ? ` · ${exp.localisation}` : ''}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {fmt(exp.dateDebut)} — {exp.enCours ? 'présent' : fmt(exp.dateFin)}
                                </p>
                                {exp.description && <p className="text-xs text-slate-600 mt-1">{exp.description}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Formations */}
                    {cv.formations?.length > 0 && (
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <GraduationCap className="w-3.5 h-3.5" /> Formation
                        </h3>
                        <div className="space-y-3">
                          {cv.formations.map((f, i) => (
                            <div key={i} className="flex gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 shrink-0" />
                              <div>
                                <p className="font-semibold text-slate-800 text-sm">{f.diplome}{f.domaine ? ` en ${f.domaine}` : ''}</p>
                                <p className="text-xs text-slate-500">{f.etablissement}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {fmt(f.dateDebut)} — {f.enCours ? 'en cours' : fmt(f.dateFin)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Langues */}
                    {cv.langues?.length > 0 && (
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5" /> Langues
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {cv.langues.map((l, i) => (
                            <span key={i} className={`px-3 py-1 rounded-lg text-xs font-medium ${niveauColor[l.niveau] || 'bg-slate-100 text-slate-600'}`}>
                              {l.langue} · {l.niveau}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white p-5 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-sm">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Aucun CV renseigné
                  </div>
                )}
              </div>

              {/* RIGHT: Actions */}
              <div className="space-y-4">
                {/* Statut */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Statut candidature</h3>
                  <select value={status} disabled={saving}
                    onChange={e => handleStatusChange(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 font-bold outline-none cursor-pointer transition-colors text-sm ${s.color}`}>
                    {STATUTS.map(st => (
                      <option key={st} value={st}>{STATUT_LABEL[st].label}</option>
                    ))}
                  </select>
                  {saving && <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Mise à jour…</p>}
                </div>

                {/* Match score */}
                {candidature.matchScore != null && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Score IA</p>
                    <ScoreBadge score={candidature.matchScore} />
                    <p className="text-xs text-slate-400 mt-1">
                      {candidature.typePostulation === 'matching' ? 'Via matching IA' : 'Candidature manuelle'}
                    </p>
                  </div>
                )}

                {/* Entretien info if scheduled */}
                {candidature.entretien?.dateEntretien && (
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Entretien planifié
                    </p>
                    <p className="text-sm font-semibold text-blue-800">
                      {new Date(candidature.entretien.dateEntretien).toLocaleDateString('fr-FR', {
                        weekday: 'long', day: 'numeric', month: 'long',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    {candidature.entretien.feedbackRecruteur && (
                      <p className="text-xs text-blue-600 mt-1 italic">"{candidature.entretien.feedbackRecruteur}"</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => setEntretienModal(true)}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 text-sm">
                    <Calendar className="w-4 h-4" />
                    {candidature.entretien?.dateEntretien ? 'Modifier l\'entretien' : 'Planifier un entretien'}
                  </button>
                  <button
                    onClick={() => navigate(`/user/${candidat._id}`)}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl font-semibold transition-all text-sm">
                    <ExternalLink className="w-4 h-4" /> Voir le profil public
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PlanifierEntretienModal
        isOpen={entretienModal}
        onClose={() => setEntretienModal(false)}
        candidatureId={candidature._id}
        candidatName={`${candidat.prenom || ''} ${candidat.nom || ''}`.trim()}
        onSuccess={() => {
          handleStatusChange('convocationEntretien');
          setEntretienModal(false);
        }}
      />
    </>
  );
}

// ── Candidate row inside offer accordion ─────────────────────────────────────
function CandidateRow({ cand, onStatusChange, onOpenProfile }) {
  const [status, setStatus] = useState(cand.etatCandidature || 'Recue');
  const [saving, setSaving] = useState(false);
  const s = STATUT_LABEL[status] || STATUT_LABEL.Recue;

  const handleChange = async (val) => {
    setSaving(true);
    try {
      await apiFetch(`/api/candidature/${cand._id}/statut`, {
        method: 'PATCH',
        body: JSON.stringify({ etatCandidature: val }),
      });
      setStatus(val);
      onStatusChange?.(cand._id, val);
    } catch (e) { alert('Erreur : ' + e.message); }
    finally { setSaving(false); }
  };

  const c = cand.idCandidat || {};

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors group">
      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
        {c.nom?.[0] || c.prenom?.[0] || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 truncate">{c.prenom || ''} {c.nom || ''}</p>
        <p className="text-xs text-slate-400 truncate">{c.email}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {cand.matchScore != null && <ScoreBadge score={cand.matchScore} />}
        <select value={status} disabled={saving}
          onChange={e => handleChange(e.target.value)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border outline-none cursor-pointer transition-colors ${s.color}`}>
          {STATUTS.map(st => <option key={st} value={st}>{STATUT_LABEL[st].label}</option>)}
        </select>
        <button onClick={() => onOpenProfile(cand)}
          className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
          title="Voir le profil">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Offer Accordion ───────────────────────────────────────────────────────────
function OfferAccordion({ offre, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedCandidature, setSelectedCandidature] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const toggle = async () => {
    if (!open && !loaded) {
      setLoading(true);
      try {
        const data = await apiFetch(`/api/candidature/offre/${offre._id}`);
        setCandidatures(data);
        setLoaded(true);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    setOpen(v => !v);
  };

  const openProfile = (cand) => {
    setSelectedCandidature({ ...cand, idOffre: offre });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cette offre ?')) return;
    try {
      await apiFetch(`/api/offre/${offre._id}`, { method: 'DELETE' });
      onDeleted(offre._id);
    } catch (e) { alert(e.message); }
  };

  const handleStatusChange = (candId, newStatus) => {
    setCandidatures(prev => prev.map(c => c._id === candId ? { ...c, etatCandidature: newStatus } : c));
    if (selectedCandidature?._id === candId) {
      setSelectedCandidature(prev => ({ ...prev, etatCandidature: newStatus }));
    }
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center p-5 gap-4 cursor-pointer" onClick={toggle}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-800">{offre.titre}</h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                offre.statutOffre === 'ouvert' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}>{offre.statutOffre === 'ouvert' ? 'Active' : 'Fermée'}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              {offre.localisation && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{offre.localisation}</span>}
              {offre.typeContrat && (
                <span className={`px-2 py-0.5 rounded-md font-semibold ${CONTRACT_COLOR[offre.typeContrat] || 'bg-slate-50 text-slate-500'}`}>
                  {offre.typeContrat}
                </span>
              )}
              <span className="text-slate-400">{new Date(offre.datePublication).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center">
              <div className="text-lg font-black text-indigo-700">{offre.applicantCount ?? '—'}</div>
              <div className="text-[10px] text-slate-400 font-semibold">Candidats</div>
            </div>
            <button onClick={e => { e.stopPropagation(); handleDelete(); }}
              className="p-1.5 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </button>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {open && (
          <div className="border-t border-slate-100">
            {loading ? (
              <div className="flex items-center justify-center py-8 gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" /> Chargement…
              </div>
            ) : candidatures.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">Aucune candidature pour cette offre.</div>
            ) : (
              <div className="p-3 space-y-1">
                <p className="px-4 pt-2 pb-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {candidatures.length} candidature{candidatures.length > 1 ? 's' : ''}
                </p>
                {candidatures.map(c => (
                  <CandidateRow key={c._id} cand={c} onOpenProfile={openProfile} onStatusChange={handleStatusChange} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <CandidateProfileModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        candidature={selectedCandidature}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}

// ── Interview Calendar ────────────────────────────────────────────────────────
function InterviewCalendar({ entretiens, loading }) {
  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );
  if (entretiens.length === 0) return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
      <CalendarDays className="w-12 h-12 text-slate-300" />
      <p className="font-medium">Aucun entretien planifié</p>
    </div>
  );

  const grouped = {};
  entretiens.forEach(e => {
    const d = new Date(e.entretien.dateEntretien).toDateString();
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(e);
  });

  const formatTime = (dt) => new Date(dt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (dt) => new Date(dt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-1 bg-white border border-slate-200 rounded-full">
              {formatDate(items[0].entretien.dateEntretien)}
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="space-y-3">
            {items.map(e => {
              const c = e.idCandidat || {};
              const offre = e.idOffre || {};
              return (
                <div key={e._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-start gap-4 hover:border-indigo-200 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0">
                    {formatTime(e.entretien.dateEntretien)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800">{c.prenom || ''} {c.nom || ''}</p>
                    <p className="text-sm text-slate-500 truncate">{offre.titre || 'Offre'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.email}</p>
                    {e.entretien.feedbackRecruteur && (
                      <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-lg p-2 italic">"{e.entretien.feedbackRecruteur}"</p>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${STATUT_LABEL.convocationEntretien.color}`}>
                    Entretien
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Recruiter Profile Page (replaces the stub) ────────────────────────────────
function RecruteurProfileSection({ recruiterId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recruiterId) return;
    apiFetch(`/api/auth/users/${recruiterId}/profil`)
      .then(data => setProfile(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [recruiterId]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;
  if (!profile) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold">
          {profile.nomEntreprise?.[0] || '?'}
        </div>
        <div>
          <h3 className="font-bold text-slate-900">{profile.nomEntreprise}</h3>
          <p className="text-sm text-slate-500">{profile.secteurActivite}</p>
          {profile.adresse?.ville && <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{profile.adresse.ville}</p>}
        </div>
      </div>
      {profile.bio && <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>}
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

  const stats = {
    offresActives: offres.filter(o => o.statutOffre === 'ouvert').length,
    totalCandidatures: offres.reduce((s, o) => s + (o.applicantCount || 0), 0),
    entretiensAVenir: entretiens.filter(e => new Date(e.entretien?.dateEntretien) >= new Date()).length,
  };

  useEffect(() => {
    const h = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const loadOffres = useCallback(async () => {
    setOffresLoading(true);
    try {
      const data = await apiFetch('/api/offre/mes-offres');
      const withCounts = await Promise.all(
        (data || []).map(async o => {
          try {
            const cands = await apiFetch(`/api/candidature/offre/${o._id}`);
            return { ...o, applicantCount: cands.length };
          } catch { return { ...o, applicantCount: 0 }; }
        })
      );
      setOffres(withCounts);
    } catch { /* silent */ }
    finally { setOffresLoading(false); }
  }, []);

  const loadEntretiens = useCallback(async () => {
    setEntretiensLoading(true);
    try {
      const data = await apiFetch('/api/candidature/entretiens');
      setEntretiens(data || []);
    } catch { /* silent */ }
    finally { setEntretiensLoading(false); }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await apiFetch('/api/notification');
      setNotifications(data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadOffres(); loadNotifications(); }, [loadOffres, loadNotifications]);
  useEffect(() => {
    if (activeTab === 'calendar' && entretiens.length === 0) loadEntretiens();
  }, [activeTab, entretiens.length, loadEntretiens]);

  const markAllRead = async () => {
    try {
      await apiFetch('/api/notification/read-all', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
    } catch { /* silent */ }
  };

  const unread = notifications.filter(n => !n.lu).length;

  const handleJobCreated = () => {
    setIsJobModalOpen(false);
    loadOffres();
  };

  const handleOfferDeleted = (id) => setOffres(prev => prev.filter(o => o._id !== id));
  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  // ── Renderers ─────────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Offres actives', value: stats.offresActives, sub: `sur ${offres.length} total` },
          { title: 'Candidatures reçues', value: stats.totalCandidatures, sub: 'toutes offres confondues' },
          { title: 'Entretiens à venir', value: stats.entretiensAVenir, sub: 'prochains rendez-vous' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-2">{s.title}</p>
            <h3 className="text-4xl font-black text-slate-800 mb-1">{s.value}</h3>
            <p className="text-xs font-medium text-slate-400">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Offres récentes</h3>
          <button onClick={() => setActiveTab('jobs')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Voir tout</button>
        </div>
        {offresLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>
        ) : offres.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />Aucune offre publiée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 text-slate-400 text-sm border-b border-slate-100">
                  <th className="font-medium py-3 px-6">Poste</th>
                  <th className="font-medium py-3 px-6 text-center">Candidats</th>
                  <th className="font-medium py-3 px-6">Statut</th>
                </tr>
              </thead>
              <tbody>
                {offres.slice(0, 4).map(o => (
                  <tr key={o._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800">{o.titre}</p>
                      {o.localisation && <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{o.localisation}</p>}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center bg-indigo-50 text-indigo-700 font-bold text-sm px-3 py-1 rounded-lg">{o.applicantCount ?? 0}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${o.statutOffre === 'ouvert' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {o.statutOffre === 'ouvert' ? 'Active' : 'Fermée'}
                      </span>
                    </td>
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
          <button onClick={() => setActiveTab('calendar')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Voir le calendrier</button>
        </div>
        <div className="p-4">
          {entretiens.filter(e => new Date(e.entretien?.dateEntretien) >= new Date()).slice(0, 3).map(e => {
            const c = e.idCandidat || {};
            const offre = e.idOffre || {};
            return (
              <div key={e._id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0">{c.nom?.[0] || '?'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">{c.prenom} {c.nom}</p>
                  <p className="text-xs text-slate-500 truncate">{offre.titre}</p>
                </div>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg shrink-0">
                  {new Date(e.entretien.dateEntretien).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
          {entretiens.filter(e => new Date(e.entretien?.dateEntretien) >= new Date()).length === 0 && (
            <p className="text-center text-sm text-slate-400 py-4">Aucun entretien à venir.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderJobs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Mes offres & candidats</h2>
          <p className="text-slate-500 text-sm mt-1">Cliquez sur une offre pour voir ses candidats.</p>
        </div>
        <button onClick={() => setIsJobModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-md shadow-indigo-200">
          <Plus className="w-5 h-5" /> Créer une offre
        </button>
      </div>

      {offresLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
      ) : offres.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
          <Briefcase className="w-12 h-12 text-slate-300" />
          <p className="font-medium">Aucune offre publiée.</p>
          <button onClick={() => setIsJobModalOpen(true)}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 mt-1">
            Publier ma première offre
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {offres.map(o => (
            <OfferAccordion key={o._id} offre={o} onDeleted={handleOfferDeleted} />
          ))}
        </div>
      )}
    </div>
  );

  const renderCalendar = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Calendrier des entretiens</h2>
          <p className="text-slate-500 text-sm mt-1">Tous vos entretiens planifiés, triés chronologiquement.</p>
        </div>
        <button onClick={loadEntretiens} disabled={entretiensLoading}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors font-semibold disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${entretiensLoading ? 'animate-spin' : ''}`} /> Actualiser
        </button>
      </div>
      <InterviewCalendar entretiens={entretiens} loading={entretiensLoading} />
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8 max-w-3xl mx-auto pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Paramètres du compte</h2>
        <p className="text-slate-500 text-sm mt-1">Gérez les informations de votre entreprise.</p>
      </div>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
          <Building className="w-5 h-5 text-indigo-600" /> Profil de l'entreprise
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: "Nom de l'entreprise", value: user.nomEntreprise || '' },
            { label: "Secteur d'activité", value: user.secteurActivite || '' },
            { label: "Email de contact", value: user.email || '' },
            { label: "Téléphone", value: user.telephone || '' },
          ].map((f, i) => (
            <div key={i}>
              <label className="block text-sm font-medium text-slate-700 mb-2">{f.label}</label>
              <input type="text" defaultValue={f.value}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors" />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea rows="3" defaultValue={user.descriptionEntreprise || ''}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors resize-none" />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all">
            <Save className="w-4 h-4" /> Sauvegarder
          </button>
        </div>
      </div>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-indigo-600" /> Notifications par email
        </h3>
        <div className="space-y-4">
          {['Nouvelle candidature reçue', 'Rappels des entretiens', 'Mises à jour du compte'].map((label, i) => (
            <label key={i} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-slate-700">{label}</span>
              <input type="checkbox" defaultChecked={i < 2} className="w-5 h-5 accent-indigo-600 cursor-pointer" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const TAB_LABELS = {
    overview: `Bonjour, ${user.nomEntreprise || 'Recruteur'} 👋`,
    jobs: 'Offres & Candidats',
    calendar: 'Calendrier des entretiens',
    settings: 'Paramètres',
  };

  const navItems = [
    { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: 'jobs', label: 'Offres & Candidats', icon: Briefcase },
    { id: 'calendar', label: 'Calendrier', icon: CalendarDays },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-slate-100 cursor-pointer" onClick={() => navigate('/')}>
          <h1 className="text-2xl font-black text-indigo-600 tracking-tight">MatchTalent.</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-1">Menu</p>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              <Icon className="w-5 h-5" /> {label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 space-y-1">
          <button onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}>
            <Settings className="w-5 h-5" /> Paramètres
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">{TAB_LABELS[activeTab] || ''}</h2>
          <div className="flex items-center gap-4">
            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifOpen(v => !v)}
                className={`relative p-2 transition-colors rounded-full ${notifOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'}`}>
                <Bell className="w-6 h-6" />
                {unread > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Notifications</h3>
                    {unread > 0 && (
                      <button onClick={markAllRead} className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline">
                        <CheckCheck className="w-3.5 h-3.5" /> Tout lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-slate-400 text-center">Aucune notification</p>
                    ) : notifications.slice(0, 8).map(n => (
                      <div key={n._id} className={`p-4 flex gap-3 ${!n.lu ? 'bg-indigo-50/30' : ''}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.lu ? 'bg-indigo-600' : 'bg-transparent'}`} />
                        <div>
                          <p className={`text-sm ${!n.lu ? 'text-slate-800 font-semibold' : 'text-slate-600'}`}>{n.contenu}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(n.dateEnvoi).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-slate-100 text-center hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => setNotifOpen(false)}>
                    <span className="text-sm text-indigo-600 font-bold">Fermer</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                {(user.nomEntreprise || user.email || 'R')[0].toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-slate-800 truncate max-w-[120px]">{user.nomEntreprise || 'Recruteur'}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
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

      <CreateJobModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        onSuccess={handleJobCreated}
      />
    </div>
  );
}