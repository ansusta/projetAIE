import React, { useState, useEffect } from 'react';
import {
  User, MapPin, Mail, Phone, FileText, Edit2,
  Settings2, Briefcase, GraduationCap, Code2, Globe, Loader2,
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

export default function ProfileTab() {
  const navigate = useNavigate();
  const [user, setUser]     = useState({});
  const [cv, setCv]         = useState(null);
  const [cvLoading, setCvLoading] = useState(true);
  const [cvError, setCvError]   = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) setUser(storedUser);

    cvService.getMyCV()
      .then((data) => setCv(data))
      .catch(() => setCvError('Aucun CV créé pour le moment.'))
      .finally(() => setCvLoading(false));
  }, []);

  const formatLocation = () => {
    if (!user.adresse) return 'Non renseigné';
    const parts = [user.adresse.ville, user.adresse.codePostal].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Non renseigné';
  };

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mon Profil</h2>
          <p className="text-slate-500">Vos informations et votre CV</p>
        </div>
        <button
          onClick={() => navigate('/edit-profile')}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-sm"
        >
          <Edit2 className="w-4 h-4" />
          Modifier le profil
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Identity card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-32 h-32 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-lg overflow-hidden">
              {user.photoProfil ? (
                <img src={user.photoProfil} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16" />
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {user.prenom || 'Prénom'} {user.nom || 'Nom'}
            </h3>
            <p className="text-blue-600 font-medium mb-1">
              {cv?.titrePoste || 'Candidat'}
            </p>
            <p className="text-slate-400 text-sm mb-4">{formatLocation()}</p>

            <div className="w-full h-px bg-slate-100 mb-4" />

            <div className="w-full space-y-3 text-left">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                <span className="text-sm truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                <span className="text-sm">{user.telephone || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                <span className="text-sm">{formatLocation()}</span>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-500" />
              Préférences
            </h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400">Salaire min.</p>
                <p className="font-semibold text-slate-800">
                  {user?.preferences?.salaireMinSouhaite
                    ? `${user.preferences.salaireMinSouhaite.toLocaleString('fr-DZ')} DZD / an`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Disponibilité</p>
                <p className="font-semibold text-slate-800">
                  {user?.preferences?.disponibilite
                    ? new Date(user.preferences.disponibilite).toLocaleDateString('fr-FR')
                    : '—'}
                </p>
              </div>
              {user?.preferences?.typesContratSouhaite?.length > 0 && (
                <div>
                  <p className="text-slate-400 mb-1">Contrats</p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.preferences.typesContratSouhaite.map((t, i) => (
                      <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {user?.preferences?.localisationsSouhaitees?.length > 0 && (
                <div>
                  <p className="text-slate-400 mb-1">Localisations</p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.preferences.localisationsSouhaitees.map((l, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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

          {/* CV sections */}
          {cvLoading ? (
            <div className="flex items-center justify-center h-40 bg-white rounded-2xl border border-slate-100">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : cvError ? (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">{cvError}</p>
              <button
                onClick={() => navigate('/onboarding')}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-blue-700"
              >
                Créer mon CV
              </button>
            </div>
          ) : cv ? (
            <>
              {/* Compétences */}
              {cv.competences?.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-blue-600" />
                    Compétences
                  </h4>
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
                  <h4 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    Expériences
                  </h4>
                  <div className="space-y-5">
                    {cv.experiences.map((exp, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-2 shrink-0 mt-1.5">
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="font-semibold text-slate-800">{exp.poste}</p>
                              <p className="text-sm text-slate-500">{exp.entreprise}{exp.localisation ? ` · ${exp.localisation}` : ''}</p>
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">
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
                  <h4 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    Formation
                  </h4>
                  <div className="space-y-5">
                    {cv.formations.map((f, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-2 shrink-0 mt-1.5">
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
                            <span className="text-xs text-slate-400 shrink-0">
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
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-green-600" />
                    Langues
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {cv.langues.map((l, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${niveauColor[l.niveau] || 'bg-slate-100 text-slate-600'}`}
                      >
                        {l.langue} · {l.niveau}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Loisirs */}
              {cv.loisirs?.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-500" />
                    Centres d'intérêt
                  </h4>
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