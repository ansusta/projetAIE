import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Building2, MapPin, Briefcase, Globe, Loader2,
  Star, Flag, Send, Trash2, MessageSquare, AlertTriangle, X,
  CheckCircle, Edit3,
} from 'lucide-react';
import { authService } from '../services/auth.service';
import { commentaireService, signalementService } from '../services/community.service';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface RecruteurProfile {
  id: string;
  nomEntreprise?: string;
  descriptionEntreprise?: string;
  secteurActivite?: string;
  adresse?: { ville?: string; pays?: string; region?: string; nomRue?: string; codePostal?: string };
  photoProfil?: string;
}

interface Offre {
  _id: string;
  titre: string;
  typeContrat?: string;
  localisation?: string;
  statutOffre?: string;
  datePublication?: string;
  salaireMin?: number;
  salaireMax?: number;
}

interface Commentaire {
  _id: string;
  contenu: string;
  note: number;
  dateCreation: string;
  idAuteur: { _id: string; prenom: string; nom: string; photoProfil?: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const CONTRACT_COLOR: Record<string, string> = {
  CDI:       'bg-blue-50 text-blue-700 border-blue-100',
  CDD:       'bg-amber-50 text-amber-700 border-amber-100',
  stage:     'bg-indigo-50 text-indigo-700 border-indigo-100',
  freelance: 'bg-purple-50 text-purple-700 border-purple-100',
};

const MOTIFS = [
  { value: 'comportement_inapproprie', label: 'Comportement inapproprié'  },
  { value: 'offre_frauduleuse',        label: 'Offre frauduleuse'         },
  { value: 'discrimination',           label: 'Discrimination'            },
  { value: 'harcelement',              label: 'Harcèlement'               },
  { value: 'fausse_identite',          label: 'Fausse identité'           },
  { value: 'autre',                    label: 'Autre'                     },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Clickable star row */
function StarRating({
  value, onChange, readonly = false,
}: { value: number; onChange?: (n: number) => void; readonly?: boolean }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-5 h-5 transition-colors ${
            n <= (hovered || value)
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-200 fill-slate-200'
          } ${!readonly ? 'cursor-pointer' : ''}`}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onChange?.(n)}
        />
      ))}
    </div>
  );
}

/** Single comment card */
function CommentCard({
  commentaire, currentUserId, onDelete,
}: { commentaire: Commentaire; currentUserId?: string; onDelete: (id: string) => void }) {
  const isOwn = commentaire.idAuteur._id === currentUserId;
  const initials = `${commentaire.idAuteur.prenom?.[0] ?? ''}${commentaire.idAuteur.nom?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
            {commentaire.idAuteur.photoProfil
              ? <img src={commentaire.idAuteur.photoProfil} alt="" className="w-full h-full object-cover" />
              : initials}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">
              {commentaire.idAuteur.prenom} {commentaire.idAuteur.nom}
            </p>
            <p className="text-xs text-slate-400">
              {new Date(commentaire.dateCreation).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarRating value={commentaire.note} readonly />
          {isOwn && (
            <button
              onClick={() => onDelete(commentaire._id)}
              className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
              title="Supprimer mon avis"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{commentaire.contenu}</p>
    </div>
  );
}

/** Rating average display */
function RatingOverview({ moyenne, total }: { moyenne: number | null; total: number }) {
  if (total === 0) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="text-3xl font-black text-slate-800">{moyenne?.toFixed(1)}</span>
      <div>
        <StarRating value={Math.round(moyenne ?? 0)} readonly />
        <p className="text-xs text-slate-400 mt-0.5">{total} avis</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Signalement modal
// ─────────────────────────────────────────────────────────────────────────────
function SignalementModal({
  isOpen, onClose, idRecruteur, nomRecruteur, existingSignalement, onSuccess,
}: {
  isOpen: boolean; onClose: () => void; idRecruteur: string;
  nomRecruteur: string; existingSignalement: any; onSuccess: () => void;
}) {
  const [motif, setMotif]               = useState(existingSignalement?.motif ?? '');
  const [description, setDescription]   = useState(existingSignalement?.description ?? '');
  const [loading, setLoading]           = useState(false);
  const [done, setDone]                 = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMotif(existingSignalement?.motif ?? '');
      setDescription(existingSignalement?.description ?? '');
      // Only reset the success screen when opening a NEW report (not an update)
      if (!existingSignalement) {
        setDone(false);
      }
    }
  }, [isOpen, existingSignalement]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motif) return;
    setLoading(true);
    try {
      await signalementService.signaler(idRecruteur, { motif, description });
      onSuccess();
      if (existingSignalement) {
        // For updates: close the modal immediately after success
        onClose();
      } else {
        // For new reports: show the success confirmation screen
        setDone(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Erreur lors du signalement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <Flag className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Signaler ce recruteur</h3>
              <p className="text-xs text-slate-500">{nomRecruteur}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="font-bold text-slate-800">Signalement envoyé</p>
            <p className="text-sm text-slate-500">Notre équipe examinera votre signalement dans les plus brefs délais.</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-slate-100 rounded-xl font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              Les faux signalements peuvent entraîner la suspension de votre compte.
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Motif *</label>
              <select
                required value={motif} onChange={e => setMotif(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-300 outline-none text-slate-700 bg-white"
              >
                <option value="">Sélectionnez un motif…</option>
                {MOTIFS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description <span className="text-slate-400 font-normal">(optionnel)</span>
              </label>
              <textarea
                rows={4}
                placeholder="Décrivez les faits avec précision…"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={2000}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-300 outline-none text-slate-700 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1 text-right">{description.length}/2000</p>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={!motif || loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                {existingSignalement ? 'Mettre à jour' : 'Envoyer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Comment form
// ─────────────────────────────────────────────────────────────────────────────
function CommentForm({
  idRecruteur, existingAvis, onPublished,
}: { idRecruteur: string; existingAvis: Commentaire | null; onPublished: (c: Commentaire) => void }) {
  const [note,    setNote]    = useState(existingAvis?.note    ?? 0);
  const [contenu, setContenu] = useState(existingAvis?.contenu ?? '');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(!existingAvis);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note || !contenu.trim()) return;
    setLoading(true);
    try {
      const result = await commentaireService.publier(idRecruteur, { contenu, note });
      onPublished(result);
      setEditing(false);
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Erreur lors de la publication.');
    } finally {
      setLoading(false);
    }
  };

  if (existingAvis && !editing) {
    return (
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-indigo-600 mb-1">Votre avis</p>
          <StarRating value={existingAvis.note} readonly />
          <p className="text-sm text-slate-700 mt-1 line-clamp-1">{existingAvis.contenu}</p>
        </div>
        <button onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-colors">
          <Edit3 className="w-3.5 h-3.5" /> Modifier
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
      <h4 className="font-bold text-slate-800 text-sm">
        {existingAvis ? 'Modifier votre avis' : 'Laisser un avis'}
      </h4>

      <div>
        <p className="text-xs font-medium text-slate-600 mb-2">Note *</p>
        <StarRating value={note} onChange={setNote} />
      </div>

      <div>
        <textarea
          required rows={3}
          placeholder="Partagez votre expérience avec ce recruteur…"
          value={contenu}
          onChange={e => setContenu(e.target.value)}
          maxLength={1000}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none text-slate-700 resize-none text-sm"
        />
        <p className="text-xs text-slate-400 mt-1 text-right">{contenu.length}/1000</p>
      </div>

      <div className="flex gap-2">
        {existingAvis && (
          <button type="button" onClick={() => setEditing(false)}
            className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 text-sm transition-colors">
            Annuler
          </button>
        )}
        <button type="submit" disabled={!note || !contenu.trim() || loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-sm transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Publier
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function RecruteurProfilePage() {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();

  const [profile, setProfile] = useState<RecruteurProfile | null>(null);
  const [offres,  setOffres]  = useState<Offre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Comments
  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
  const [moyenne,      setMoyenne]      = useState<number | null>(null);
  const [totalAvis,    setTotalAvis]    = useState(0);
  const [monAvis,      setMonAvis]      = useState<Commentaire | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Signalement
  const [signalOpen,     setSignalOpen]     = useState(false);
  const [monSignalement, setMonSignalement] = useState<any>(null);

  // Current logged-in user (to know if they're a candidate)
  const currentUser = JSON.parse(localStorage.getItem('user') ?? '{}');
  const isCandidat  = currentUser?.role === 'candidat';

  // ── Load profile + offres
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      authService.getProfilPublicRecruteur(id),
      authService.getOffresRecruteur(id).catch(() => []),
    ])
      .then(([prof, ofs]) => { setProfile(prof); setOffres(ofs); })
      .catch(() => setError('Profil introuvable ou erreur de chargement.'))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Load comments
  useEffect(() => {
    if (!id) return;
    setCommentsLoading(true);
    commentaireService.getForRecruteur(id)
      .then(({ commentaires: c, moyenne: m, total }) => {
        setCommentaires(c);
        setMoyenne(m);
        setTotalAvis(total);
      })
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  }, [id]);

  // ── Load candidate's own review + existing report
  useEffect(() => {
    if (!id || !isCandidat) return;
    commentaireService.getMonAvis(id).then(setMonAvis).catch(() => {});
    signalementService.getMonSignalement(id).then(setMonSignalement).catch(() => {});
  }, [id, isCandidat]);

  // ── Handlers
  const handleCommentPublished = (nouveau: Commentaire) => {
    setCommentaires(prev => {
      const idx = prev.findIndex(c => c._id === nouveau._id);
      if (idx !== -1) { const u = [...prev]; u[idx] = nouveau; return u; }
      return [nouveau, ...prev];
    });
    setMonAvis(nouveau);
    // Recompute stats locally
    commentaireService.getForRecruteur(id!).then(({ moyenne: m, total }) => {
      setMoyenne(m); setTotalAvis(total);
    }).catch(() => {});
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Supprimer votre avis ?')) return;
    try {
      await commentaireService.supprimer(commentId);
      setCommentaires(prev => prev.filter(c => c._id !== commentId));
      setMonAvis(null);
      commentaireService.getForRecruteur(id!).then(({ moyenne: m, total }) => {
        setMoyenne(m); setTotalAvis(total);
      }).catch(() => {});
    } catch (e: any) {
      alert(e.response?.data?.error ?? 'Erreur lors de la suppression.');
    }
  };

  // ── Loading / error states
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );

  if (error || !profile) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <p className="text-red-500 font-medium">{error || 'Profil introuvable'}</p>
      <button onClick={() => navigate(-1)} className="text-indigo-600 hover:underline font-semibold">← Retour</button>
    </div>
  );

  const initials     = (profile.nomEntreprise || '?')[0].toUpperCase();
  const location     = [profile.adresse?.ville, profile.adresse?.pays].filter(Boolean).join(', ');
  const activeOffres = offres.filter(o => o.statutOffre === 'ouvert');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors">
          <ChevronLeft className="w-4 h-4" /> Retour
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Hero card */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="h-36 bg-gradient-to-r from-indigo-600 to-violet-600" />
          <div className="px-8 pb-8">
            <div className="-mt-14 mb-6 flex items-end justify-between">
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-indigo-100 flex items-center justify-center shrink-0">
                {profile.photoProfil
                  ? <img src={profile.photoProfil} alt="Logo" className="w-full h-full object-cover" />
                  : <span className="text-3xl font-black text-indigo-500">{initials}</span>}
              </div>
              <div className="mb-3 flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold border border-indigo-100 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Recruteur
                </span>
                {/* Report button — only for logged-in candidates */}
                {isCandidat && (
                  <button
                    onClick={() => setSignalOpen(true)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                      monSignalement
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-red-300 hover:text-red-500 hover:bg-red-50'
                    }`}
                    title="Signaler ce recruteur"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    {monSignalement ? 'Signalé' : 'Signaler'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-black text-slate-900">{profile.nomEntreprise || 'Entreprise'}</h1>
                {profile.secteurActivite && (
                  <p className="text-indigo-600 font-semibold mt-1 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" /> {profile.secteurActivite}
                  </p>
                )}
                {location && (
                  <p className="mt-2 text-sm text-slate-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-slate-400" /> {location}
                  </p>
                )}
              </div>
              {/* Average rating chip */}
              {totalAvis > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl shrink-0">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-black text-slate-800">{moyenne?.toFixed(1)}</span>
                  <span className="text-xs text-slate-400">({totalAvis})</span>
                </div>
              )}
            </div>

            {profile.descriptionEntreprise && (
              <>
                <div className="h-px bg-slate-100 my-6" />
                <div>
                  <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">À propos</h2>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line">{profile.descriptionEntreprise}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Offres actives', value: activeOffres.length,          icon: Briefcase,     color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Total offres',   value: offres.length,                 icon: Globe,         color: 'text-violet-600 bg-violet-50' },
            { label: 'Avis candidats', value: totalAvis,                     icon: MessageSquare, color: 'text-amber-600 bg-amber-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <p className="font-black text-slate-900 text-2xl">{s.value}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Active offers */}
        {activeOffres.length > 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Offres d'emploi actives</h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {activeOffres.length} poste{activeOffres.length > 1 ? 's' : ''} disponible{activeOffres.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="divide-y divide-slate-50">
              {activeOffres.map(offre => (
                <div key={offre._id} className="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold text-sm shrink-0">
                    {offre.titre[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{offre.titre}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      {offre.localisation && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{offre.localisation}</span>}
                      {offre.salaireMin   && <span>{offre.salaireMin.toLocaleString()} DZD/mois</span>}
                    </div>
                  </div>
                  {offre.typeContrat && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border shrink-0 ${CONTRACT_COLOR[offre.typeContrat] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                      {offre.typeContrat}
                    </span>
                  )}
                  {offre.datePublication && (
                    <span className="text-xs text-slate-400 shrink-0 hidden sm:block">
                      {new Date(offre.datePublication).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center py-14 text-slate-400 gap-3 shadow-sm">
            <Briefcase className="w-10 h-10 text-slate-300" />
            <p className="font-medium">Aucune offre active pour le moment</p>
          </div>
        )}

        {/* ── Comments wall */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">Avis des candidats</h2>
              {totalAvis > 0 && <RatingOverview moyenne={moyenne} total={totalAvis} />}
            </div>
          </div>

          {/* Write / edit review — candidates only */}
          {isCandidat && (
            <CommentForm
              idRecruteur={id!}
              existingAvis={monAvis}
              onPublished={handleCommentPublished}
            />
          )}

          {commentsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          ) : commentaires.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <MessageSquare className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-medium">Aucun avis pour le moment</p>
              {isCandidat && <p className="text-xs">Soyez le premier à laisser un avis !</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {commentaires.map(c => (
                <CommentCard
                  key={c._id}
                  commentaire={c}
                  currentUserId={currentUser?._id ?? currentUser?.id}
                  onDelete={handleDeleteComment}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Signalement modal */}
      <SignalementModal
        isOpen={signalOpen}
        onClose={() => setSignalOpen(false)}
        idRecruteur={id!}
        nomRecruteur={profile.nomEntreprise ?? 'ce recruteur'}
        existingSignalement={monSignalement}
        onSuccess={() => {
          // Refresh the signalement state from server
          signalementService.getMonSignalement(id!).then(setMonSignalement).catch(() => {});
          // Close the modal immediately (for updates; new reports show success screen first)
          if (monSignalement) {
            setSignalOpen(false);
          }
        }}
      />
    </div>
  );
}