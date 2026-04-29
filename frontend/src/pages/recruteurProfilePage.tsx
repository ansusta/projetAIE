import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Building2, MapPin, Briefcase, Globe, Loader2,
} from 'lucide-react';
import { authService } from '../services/auth.service'; // adjust path as needed

interface RecruteurProfile {
  id: string;
  nomEntreprise?: string;
  descriptionEntreprise?: string;
  secteurActivite?: string;
  adresse?: {
    ville?: string;
    pays?: string;
    region?: string;
    nomRue?: string;
    codePostal?: string;
  };
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

const CONTRACT_COLOR: Record<string, string> = {
  CDI:       'bg-blue-50 text-blue-700 border-blue-100',
  CDD:       'bg-amber-50 text-amber-700 border-amber-100',
  stage:     'bg-indigo-50 text-indigo-700 border-indigo-100',
  freelance: 'bg-purple-50 text-purple-700 border-purple-100',
};

export default function RecruteurProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [profile, setProfile] = useState<RecruteurProfile | null>(null);
  const [offres, setOffres]   = useState<Offre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      authService.getProfilPublicRecruteur(id),
      authService.getOffresRecruteur(id).catch(() => []),  // add this service method below
    ])
      .then(([prof, ofs]) => {
        setProfile(prof);
        setOffres(ofs);
      })
      .catch(() => setError('Profil introuvable ou erreur de chargement.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 font-medium">{error || 'Profil introuvable'}</p>
        <button onClick={() => navigate(-1)} className="text-indigo-600 hover:underline font-semibold">
          ← Retour
        </button>
      </div>
    );
  }

  const initials    = (profile.nomEntreprise || '?')[0].toUpperCase();
  const location    = [profile.adresse?.ville, profile.adresse?.pays].filter(Boolean).join(', ');
  const activeOffres = offres.filter(o => o.statutOffre === 'ouvert');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Retour
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Hero card */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="h-36 bg-gradient-to-r from-indigo-600 to-violet-600" />

          <div className="px-8 pb-8">
            <div className="-mt-14 mb-6 flex items-end justify-between">
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-indigo-100 flex items-center justify-center shrink-0">
                {profile.photoProfil ? (
                  <img src={profile.photoProfil} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-indigo-500">{initials}</span>
                )}
              </div>
              <span className="mb-3 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold border border-indigo-100 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Recruteur
              </span>
            </div>

            <h1 className="text-3xl font-black text-slate-900">
              {profile.nomEntreprise || 'Entreprise'}
            </h1>
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

            {profile.descriptionEntreprise && (
              <>
                <div className="h-px bg-slate-100 my-6" />
                <div>
                  <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">À propos</h2>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                    {profile.descriptionEntreprise}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Offres actives', value: activeOffres.length, icon: Briefcase, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Total offres',   value: offres.length,       icon: Globe,     color: 'text-violet-600 bg-violet-50' },
            { label: 'Secteur', value: profile.secteurActivite || '—', icon: Building2, color: 'text-slate-600 bg-slate-100', small: true },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <p className={`font-black text-slate-900 ${s.small ? 'text-sm' : 'text-2xl'}`}>{s.value}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Job offers */}
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
                      {offre.localisation && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{offre.localisation}</span>
                      )}
                      {offre.salaireMin && (
                        <span>{offre.salaireMin.toLocaleString()} DZD/mois</span>
                      )}
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
      </div>
    </div>
  );
}