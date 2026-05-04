import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Star, Trash2, Eye, EyeOff, Ban, RefreshCw,
  Loader2, ChevronLeft, ChevronRight, AlertTriangle, User,
  Building, CheckCircle, Shield, ShieldOff, Search, Filter, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const API = 'http://localhost:5000';
const PAGE_SIZE = 15;

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// ── Star display ──────────────────────────────────────────────────────────────
function Stars({ note }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= note ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
        />
      ))}
    </div>
  );
}

// ── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ isOpen, onClose, onConfirm, title, description, confirmLabel, danger = true, loading }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
              <AlertTriangle className={`w-4 h-4 ${danger ? 'text-red-500' : 'text-amber-500'}`} />
            </div>
            <h3 className="font-bold text-slate-800">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors text-sm">
              Annuler
            </button>
            <button onClick={onConfirm} disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white text-sm transition-colors disabled:opacity-50 ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── User chip (candidate or recruiter) ────────────────────────────────────────
function UserChip({ user, label, icon: Icon, color }) {
  if (!user) return <span className="text-slate-400 text-xs italic">—</span>;
  const isBanned = user.statusCompte === 'bloque';
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">
          {user.prenom ? `${user.prenom} ${user.nom}` : user.nomEntreprise || user.email}
        </p>
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
          {isBanned && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 shrink-0">Banni</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminCommentaires() {
  const [comments, setComments]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');
  const [filterVisible, setFilterVisible] = useState('all'); // 'all' | 'visible' | 'hidden'

  // Confirm modal state
  const [modal, setModal] = useState({ open: false, action: null, payload: null, loading: false });

  const pages = Math.ceil(total / PAGE_SIZE);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const load = useCallback(async (p = page, fv = filterVisible) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: PAGE_SIZE });
      if (fv === 'visible') params.set('visible', 'true');
      if (fv === 'hidden')  params.set('visible', 'false');

      const res = await fetch(`${API}/api/admin/commentaires?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments(data.commentaires || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch {
      toast.error('Impossible de charger les commentaires.');
    } finally {
      setLoading(false);
    }
  }, [page, filterVisible]);

  useEffect(() => { load(1, filterVisible); }, [filterVisible]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const toggleVisibility = async (id) => {
    try {
      const res = await fetch(`${API}/api/commentaires/${id}/visibilite`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      const { visible } = await res.json();
      setComments(prev => prev.map(c => c._id === id ? { ...c, visible } : c));
      toast.success(visible ? 'Commentaire visible' : 'Commentaire masqué');
    } catch { toast.error('Erreur.'); }
  };

  const deleteComment = async (id) => {
    setModal(m => ({ ...m, loading: true }));
    try {
      const res = await fetch(`${API}/api/commentaires/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      setComments(prev => prev.filter(c => c._id !== id));
      setTotal(t => t - 1);
      toast.success('Commentaire supprimé.');
      setModal({ open: false, action: null, payload: null, loading: false });
    } catch {
      toast.error('Erreur lors de la suppression.');
      setModal(m => ({ ...m, loading: false }));
    }
  };

  const banUser = async (userId, userName) => {
    setModal(m => ({ ...m, loading: true }));
    try {
      const res = await fetch(`${API}/api/admin/users/${userId}/suspend`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      // Reflect ban in local state for both candidate and recruiter fields
      setComments(prev => prev.map(c => {
        if (c.idAuteur?._id === userId)    return { ...c, idAuteur:    { ...c.idAuteur,    statusCompte: 'bloque' } };
        if (c.idRecruteur?._id === userId) return { ...c, idRecruteur: { ...c.idRecruteur, statusCompte: 'bloque' } };
        return c;
      }));
      toast.success(`${userName} a été banni.`);
      setModal({ open: false, action: null, payload: null, loading: false });
    } catch {
      toast.error('Erreur lors du bannissement.');
      setModal(m => ({ ...m, loading: false }));
    }
  };

  // ── Open confirm modal ─────────────────────────────────────────────────────
  const confirmDelete = (comment) =>
    setModal({
      open:    true,
      action:  'delete',
      payload: comment,
      loading: false,
    });

  const confirmBan = (userId, name, role) =>
    setModal({
      open:    true,
      action:  'ban',
      payload: { userId, name, role },
      loading: false,
    });

  const handleConfirm = () => {
    if (modal.action === 'delete') deleteComment(modal.payload._id);
    if (modal.action === 'ban')    banUser(modal.payload.userId, modal.payload.name);
  };

  // ── Filtered comments (client-side search) ─────────────────────────────────
  const filtered = search.trim()
    ? comments.filter(c => {
        const q = search.toLowerCase();
        return (
          c.contenu?.toLowerCase().includes(q) ||
          c.idAuteur?.prenom?.toLowerCase().includes(q) ||
          c.idAuteur?.nom?.toLowerCase().includes(q) ||
          c.idAuteur?.email?.toLowerCase().includes(q) ||
          c.idRecruteur?.nomEntreprise?.toLowerCase().includes(q) ||
          c.idRecruteur?.email?.toLowerCase().includes(q)
        );
      })
    : comments;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-500" />
            Gestion des avis
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {total} avis au total — modérez, masquez ou supprimez, et bannissez les auteurs ou recruteurs concernés.
          </p>
        </div>
        <button onClick={() => load(page, filterVisible)} disabled={loading}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors font-semibold disabled:opacity-50 shrink-0">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par auteur, recruteur ou contenu…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Visibility filter */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
          {[
            { value: 'all',     label: 'Tous'    },
            { value: 'visible', label: 'Visibles' },
            { value: 'hidden',  label: 'Masqués'  },
          ].map(f => (
            <button key={f.value} onClick={() => setFilterVisible(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterVisible === f.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" /> Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <MessageSquare className="w-10 h-10 text-slate-200" />
            <p className="font-medium">Aucun avis{search ? ' pour cette recherche' : filterVisible !== 'all' ? ' dans ce filtre' : ''}.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(c => {
              const authorBanned    = c.idAuteur?.statusCompte    === 'bloque';
              const recruteurBanned = c.idRecruteur?.statusCompte === 'bloque';

              return (
                <div key={c._id} className={`p-5 transition-colors hover:bg-slate-50/50 ${!c.visible ? 'opacity-60' : ''}`}>
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">

                    {/* Comment body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Stars note={c.note} />
                        <span className="text-xs font-bold text-slate-600">{c.note}/5</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-400">
                          {new Date(c.dateCreation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        {!c.visible && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-500">Masqué</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">{c.contenu}</p>
                    </div>

                    {/* Author + recruiter */}
                    <div className="flex flex-col sm:flex-row gap-4 lg:w-96 shrink-0">
                      {/* Candidate / author */}
                      <div className="flex-1 bg-slate-50 rounded-2xl p-3 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidat</p>
                        <UserChip
                          user={c.idAuteur}
                          icon={User}
                          color="bg-blue-100 text-blue-600"
                        />
                        {c.idAuteur && (
                          <button
                            onClick={() => confirmBan(c.idAuteur._id, `${c.idAuteur.prenom} ${c.idAuteur.nom}`, 'candidat')}
                            disabled={authorBanned}
                            className={`w-full flex items-center justify-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-xl border transition-all ${
                              authorBanned
                                ? 'border-red-100 text-red-400 bg-red-50 cursor-default'
                                : 'border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50'
                            }`}
                          >
                            {authorBanned ? <ShieldOff className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                            {authorBanned ? 'Déjà banni' : 'Bannir'}
                          </button>
                        )}
                      </div>

                      {/* Recruiter */}
                      <div className="flex-1 bg-slate-50 rounded-2xl p-3 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recruteur</p>
                        <UserChip
                          user={c.idRecruteur}
                          icon={Building}
                          color="bg-indigo-100 text-indigo-600"
                        />
                        {c.idRecruteur && (
                          <button
                            onClick={() => confirmBan(c.idRecruteur._id, c.idRecruteur.nomEntreprise || c.idRecruteur.email, 'recruteur')}
                            disabled={recruteurBanned}
                            className={`w-full flex items-center justify-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-xl border transition-all ${
                              recruteurBanned
                                ? 'border-red-100 text-red-400 bg-red-50 cursor-default'
                                : 'border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50'
                            }`}
                          >
                            {recruteurBanned ? <ShieldOff className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                            {recruteurBanned ? 'Déjà banni' : 'Bannir'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Moderation actions */}
                    <div className="flex lg:flex-col items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleVisibility(c._id)}
                        title={c.visible ? 'Masquer' : 'Rendre visible'}
                        className={`p-2 rounded-xl border text-sm font-semibold transition-all ${
                          c.visible
                            ? 'border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50'
                            : 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {c.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => confirmDelete(c)}
                        title="Supprimer définitivement"
                        className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} / {pages} · {total} avis
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(page - 1, filterVisible)}
              disabled={page === 1 || loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>
            <button
              onClick={() => load(page + 1, filterVisible)}
              disabled={page === pages || loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      <ConfirmModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, action: null, payload: null, loading: false })}
        onConfirm={handleConfirm}
        loading={modal.loading}
        danger
        title={
          modal.action === 'delete' ? 'Supprimer le commentaire' :
          modal.action === 'ban'    ? `Bannir ${modal.payload?.role === 'recruteur' ? 'le recruteur' : 'le candidat'}` : ''
        }
        description={
          modal.action === 'delete'
            ? 'Cette action est irréversible. Le commentaire sera définitivement supprimé de la plateforme.'
            : modal.action === 'ban'
            ? `Le compte de "${modal.payload?.name}" sera immédiatement suspendu. L'utilisateur ne pourra plus se connecter jusqu'à réactivation.`
            : ''
        }
        confirmLabel={modal.action === 'delete' ? 'Supprimer' : 'Bannir'}
      />
    </div>
  );
}