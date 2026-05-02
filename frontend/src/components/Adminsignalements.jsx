
import React, { useState, useEffect, useCallback } from 'react';
import {
  Flag, Loader2, RefreshCw, CheckCircle, XCircle,
  ChevronRight, User, Building, AlertTriangle,
  Ban, Eye, X, ShieldOff,
} from 'lucide-react';
import { signalementService } from '../services/community.service';

// ── Helpers ───────────────────────────────────────────────────────────────────
const MOTIF_LABEL = {
  comportement_inapproprie: 'Comportement inapproprié',
  offre_frauduleuse:        'Offre frauduleuse',
  discrimination:           'Discrimination',
  harcelement:              'Harcèlement',
  fausse_identite:          'Fausse identité',
  autre:                    'Autre',
};

const STATUT_STYLE = {
  en_attente: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ignore:     { label: 'Ignoré',     cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  traite:     { label: 'Traité',     cls: 'bg-green-50 text-green-700 border-green-200'  },
};

// ── Decision modal ────────────────────────────────────────────────────────────
function DecisionModal({ isOpen, onClose, signalement, onDone }) {
  const [statut,        setStatut]        = useState('ignore');
  const [noteAdmin,     setNoteAdmin]     = useState('');
  const [banir,         setBanir]         = useState(false);
  const [loading,       setLoading]       = useState(false);

  useEffect(() => {
    if (isOpen) { setStatut('ignore'); setNoteAdmin(''); setBanir(false); }
  }, [isOpen]);

  if (!isOpen || !signalement) return null;

  const recruteur = signalement.idRecruteur || {};
  const signaleur  = signalement.idSignaleur || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signalementService.traiter(signalement._id, {
        statut,
        noteAdmin,
        banirRecruteur: banir,
      });
      onDone();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error ?? 'Erreur lors du traitement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <Flag className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Traiter le signalement</h3>
              <p className="text-xs text-slate-500">
                {recruteur.nomEntreprise ?? recruteur.email} · signalé par {signaleur.prenom} {signaleur.nom}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Summary */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="font-semibold text-slate-600 w-24 shrink-0">Motif</span>
              <span className="text-slate-800">{MOTIF_LABEL[signalement.motif] ?? signalement.motif}</span>
            </div>
            {signalement.description && (
              <div className="flex gap-2">
                <span className="font-semibold text-slate-600 w-24 shrink-0">Description</span>
                <span className="text-slate-700 leading-relaxed">{signalement.description}</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="font-semibold text-slate-600 w-24 shrink-0">Date</span>
              <span className="text-slate-700">
                {new Date(signalement.dateSignalement).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Decision */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Décision</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'ignore', label: 'Ignorer',  desc: 'Classer sans suite',  icon: XCircle,     cls: 'border-slate-200 text-slate-600' },
                { value: 'traite', label: 'Traiter',  desc: 'Marquer comme traité', icon: CheckCircle, cls: 'border-green-200 text-green-700 bg-green-50' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatut(opt.value)}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all text-center ${
                    statut === opt.value
                      ? `${opt.cls} ring-2 ring-offset-1 ring-current`
                      : 'border-slate-100 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  <opt.icon className="w-5 h-5" />
                  <span className="font-bold text-sm">{opt.label}</span>
                  <span className="text-xs opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ban toggle — only shown when action is 'traite' */}
          {statut === 'traite' && (
            <label className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl cursor-pointer hover:bg-red-100 transition-colors">
              <input
                type="checkbox"
                checked={banir}
                onChange={e => setBanir(e.target.checked)}
                className="accent-red-600 w-4 h-4"
              />
              <div>
                <p className="text-sm font-bold text-red-700 flex items-center gap-1.5">
                  <Ban className="w-4 h-4" /> Suspendre le compte du recruteur
                </p>
                <p className="text-xs text-red-500 mt-0.5">
                  Le recruteur sera immédiatement bloqué et notifié.
                </p>
              </div>
            </label>
          )}

          {/* Note admin */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Note interne <span className="text-slate-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Observations pour l'équipe…"
              value={noteAdmin}
              onChange={e => setNoteAdmin(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none text-slate-700 resize-none text-sm"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-colors ${
                statut === 'traite' && banir
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } disabled:opacity-60`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Confirmer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminSignalements() {
  const [signalements,   setSignalements]   = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [total,          setTotal]          = useState(0);
  const [filterStatut,   setFilterStatut]   = useState('');       // '' | 'en_attente' | 'ignore' | 'traite'
  const [selected,       setSelected]       = useState(null);
  const [modalOpen,      setModalOpen]      = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterStatut ? { statut: filterStatut } : {};
      const data   = await signalementService.lister(params);
      setSignalements(data.signalements ?? []);
      setTotal(data.total ?? 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [filterStatut]);

  useEffect(() => { load(); }, [load]);

  const openModal = (s) => { setSelected(s); setModalOpen(true); };

  const pending = signalements.filter(s => s.statut === 'en_attente').length;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Flag className="w-6 h-6 text-red-500" />
            Signalements
            {pending > 0 && (
              <span className="ml-2 bg-red-100 text-red-700 text-sm font-bold px-2.5 py-0.5 rounded-full border border-red-200">
                {pending} en attente
              </span>
            )}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {total} signalement{total > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status filter */}
          <div className="flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
            {[
              { value: '',           label: 'Tous'       },
              { value: 'en_attente', label: 'En attente' },
              { value: 'traite',     label: 'Traités'    },
              { value: 'ignore',     label: 'Ignorés'    },
            ].map(f => (
              <button key={f.value}
                onClick={() => setFilterStatut(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStatut === f.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors font-semibold text-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" /> Chargement…
          </div>
        ) : signalements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Flag className="w-10 h-10 text-slate-200" />
            <p className="font-medium">Aucun signalement{filterStatut ? ' pour ce filtre' : ''}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-xs border-b border-slate-100">
                  <th className="font-semibold py-4 px-6">Signalé par</th>
                  <th className="font-semibold py-4 px-6">Recruteur ciblé</th>
                  <th className="font-semibold py-4 px-6">Motif</th>
                  <th className="font-semibold py-4 px-6 text-center">Statut</th>
                  <th className="font-semibold py-4 px-6 text-center">Recruteur</th>
                  <th className="font-semibold py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {signalements.map(s => {
                  const sig = s.idSignaleur || {};
                  const rec = s.idRecruteur || {};
                  const st  = STATUT_STYLE[s.statut] ?? STATUT_STYLE.en_attente;
                  const isBanned = rec.statusCompte === 'bloque';

                  return (
                    <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      {/* Reporter */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{sig.prenom} {sig.nom}</p>
                            <p className="text-xs text-slate-400">{sig.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Recruiter */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Building className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{rec.nomEntreprise ?? '—'}</p>
                            <p className="text-xs text-slate-400">{rec.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Motif */}
                      <td className="py-4 px-6">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                          {MOTIF_LABEL[s.motif] ?? s.motif}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>

                      {/* Recruiter account status */}
                      <td className="py-4 px-6 text-center">
                        {isBanned ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                            <ShieldOff className="w-3 h-3" /> Suspendu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> Actif
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right">
                        {s.statut === 'en_attente' ? (
                          <button onClick={() => openModal(s)}
                            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold transition-all">
                            Décider <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => openModal(s)}
                            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all">
                            <Eye className="w-3.5 h-3.5" /> Voir
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DecisionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        signalement={selected}
        onDone={load}
      />
    </div>
  );
}