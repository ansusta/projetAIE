import React, { useState, useEffect } from 'react';
import {
  User, MapPin, Mail, Phone, FileText, Edit2,
  Settings2, Briefcase, GraduationCap, Code2,
  Globe, Loader2, PenLine, Euro, Calendar,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cvService } from '../services/cv.service';

const niveauColor = {
  débutant:      'bg-slate-100 text-slate-600',
  intermédiaire: 'bg-blue-50 text-blue-600',
  avancé:        'bg-indigo-50 text-indigo-600',
  courant:       'bg-green-50 text-green-700',
  natif:         'bg-emerald-50 text-emerald-700',
};

function fmt(dateStr) {
  if (!dateStr) return '?';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}

// Renders a single preference row — always visible even when empty
function PrefRow({ label, value, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      {children || (
        <p className="text-sm font-medium text-slate-700">{value || <span className="italic text-slate-400">—</span>}</p>
      )}
    </div>
  );
}

export default function ProfileTab() {
  const navigate = useNavigate();

  // 1. We removed `setUser` because we don't need to update it here
  const [user] = useState(() => {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        return JSON.parse(userString);
      }
      return {};
    } catch (error) {
      console.error("Error parsing user data:", error);
      return {}; 
    }
  });

  // Check if the user object has any keys
  const hasUser = Object.keys(user).length > 0;

  const [cv, setCv]               = useState(null);
  const [cvError, setCvError]     = useState('');
  
  // 2. Initialize loading intelligently: ONLY start loading if we have a user!
  const [cvLoading, setCvLoading] = useState(hasUser);

  useEffect(() => {
    // 3. We only fetch if we have a user. No "else" block needed anymore!
    if (hasUser) {
      cvService.getMyCV()
        .then(data => setCv(data))
        .catch(() => setCvError('Aucun CV pour le moment.'))
        .finally(() => setCvLoading(false));
    }
  }, [hasUser]);
  
  const formatLocation = () => {
    if (!user.adresse) return 'Non renseigné';
    const parts = [user.adresse.ville, user.adresse.codePostal].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Non renseigné';
  };

  const prefs = user.preferences || {};

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mon Profil</h2>
          <p className="text-slate-500">Vos informations, préférences et CV</p>
        </div>
        <button
          onClick={() => navigate('/edit-profile')}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-sm">
          <Edit2 className="w-4 h-4" />
          Modifier le profil
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Identity */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-lg overflow-hidden">
              {user.photoProfil
                ? <img src={user.photoProfil} alt="Profil" className="w-full h-full object-cover" />
                : <User className="w-14 h-14 text-blue-300" />}
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {user.prenom || 'Prénom'} {user.nom || 'Nom'}
            </h3>
            <p className="text-blue-600 font-medium text-sm mb-4">
              {cv?.titrePoste || 'Candidat'}
            </p>

            <div className="w-full h-px bg-slate-100 mb-4" />

            <div className="w-full space-y-3 text-left text-sm">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{user.email || '—'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{user.telephone || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{formatLocation()}</span>
              </div>
            </div>
          </div>

          {/* ── ALL 5 PREFERENCES ── */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <Settings2 className="w-4 h-4 text-indigo-500" />
                Préférences
              </h4>
              <button onClick={() => navigate('/edit-profile')}
                className="text-xs text-indigo-600 hover:underline font-medium">
                Modifier
              </button>
            </div>

            <div className="space-y-4">
              {/* 1. Salaire */}
              <PrefRow label="Salaire min.">
                <p className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                  <Euro className="w-3.5 h-3.5 text-slate-400" />
                  {prefs.salaireMinSouhaite
                    ? `${prefs.salaireMinSouhaite.toLocaleString('fr-DZ')} DZD / an`
                    : <span className="italic font-normal text-slate-400">—</span>}
                </p>
              </PrefRow>

              {/* 2. Disponibilité */}
              <PrefRow label="Disponibilité">
                <p className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {prefs.disponibilite
                    ? new Date(prefs.disponibilite).toLocaleDateString('fr-FR')
                    : <span className="italic font-normal text-slate-400">—</span>}
                </p>
              </PrefRow>

              {/* 3. Types de contrat */}
              <PrefRow label="Types de contrat">
                {prefs.typesContratSouhaite?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {prefs.typesContratSouhaite.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                ) : <p className="text-sm italic text-slate-400">—</p>}
              </PrefRow>

              {/* 4. Secteurs */}
              <PrefRow label="Secteurs">
                {prefs.secteursSouhaites?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {prefs.secteursSouhaites.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : <p className="text-sm italic text-slate-400">—</p>}
              </PrefRow>

              {/* 5. Localisations */}
              <PrefRow label="Localisations">
                {prefs.localisationsSouhaitees?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {prefs.localisationsSouhaitees.map((l, i) => (
                      <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                        <MapPin className="w-2.5 h-2.5" />{l}
                      </span>
                    ))}
                  </div>
                ) : <p className="text-sm italic text-slate-400">—</p>}
              </PrefRow>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Bio */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              À propos
            </h4>
            <p className="text-slate-600 leading-relaxed">
              {user.bio ||
                "Aucune bio renseignée. Cliquez sur « Modifier le profil » pour vous présenter."}
            </p>
          </div>

          {/* CV block */}
          {cvLoading ? (
            <div className="flex items-center justify-center h-40 bg-white rounded-2xl border border-slate-100">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : cvError ? (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">{cvError}</p>
              <button onClick={() => navigate('/onboarding')}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700">
                Créer mon CV
              </button>
            </div>
          ) : cv ? (
            <>
              {/* CV header + edit button */}
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Mon CV
                  {cv.titrePoste && (
                    <span className="text-sm font-normal text-slate-500">· {cv.titrePoste}</span>
                  )}
                </h4>
                <button onClick={() => navigate('/edit-cv')}
                  className="flex items-center gap-1.5 text-sm text-blue-600 font-semibold hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors">
                  <PenLine className="w-4 h-4" />
                  Modifier le CV
                </button>
              </div>

              {/* Compétences */}
              {cv.competences?.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h5 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                    <Code2 className="w-4 h-4 text-blue-600" /> Compétences
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {cv.competences.map((c, i) => (
                      <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Expériences */}
              {cv.experiences?.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h5 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-blue-600" /> Expériences
                  </h5>
                  <div className="space-y-5">
                    {cv.experiences.map((exp, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-2 shrink-0 pt-2">
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="font-semibold text-slate-800">{exp.poste}</p>
                              <p className="text-sm text-slate-500">
                                {exp.entreprise}{exp.localisation ? ` · ${exp.localisation}` : ''}
                              </p>
                            </div>
                            <span className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                              <Clock className="w-3 h-3" />
                              {fmt(exp.dateDebut)} — {exp.enCours ? 'présent' : fmt(exp.dateFin)}
                            </span>
                          </div>
                          {exp.description && (
                            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formations */}
              {cv.formations?.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h5 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                    <GraduationCap className="w-4 h-4 text-indigo-600" /> Formation
                  </h5>
                  <div className="space-y-5">
                    {cv.formations.map((f, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-2 shrink-0 pt-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="font-semibold text-slate-800">
                                {f.diplome}{f.domaine ? ` en ${f.domaine}` : ''}
                              </p>
                              <p className="text-sm text-slate-500">{f.etablissement}</p>
                            </div>
                            <span className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                              <Clock className="w-3 h-3" />
                              {fmt(f.dateDebut)} — {f.enCours ? 'en cours' : fmt(f.dateFin)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Langues */}
              {cv.langues?.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h5 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-green-600" /> Langues
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {cv.langues.map((l, i) => (
                      <span key={i}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${niveauColor[l.niveau] || 'bg-slate-100 text-slate-600'}`}>
                        {l.langue} · {l.niveau}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Loisirs */}
              {cv.loisirs?.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h5 className="font-bold text-slate-800 mb-3 text-sm">Centres d'intérêt</h5>
                  <div className="flex flex-wrap gap-2">
                    {cv.loisirs.map((l, i) => (
                      <span key={i} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium border border-orange-100">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}