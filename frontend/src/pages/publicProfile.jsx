import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Building, Briefcase, ArrowLeft, Loader2, User, GraduationCap, Star, Globe } from 'lucide-react';
import { authService } from '../services/auth.service';

// Helper pour l'image
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${path}`;
};

// Helper pour formater les dates MongoDB
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
};

export default function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getPublicProfile(id);
        setProfile(data);
      } catch (err) {
        console.error(err);
        setError("Profil introuvable ou erreur de chargement.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="text-red-500 font-medium">{error}</div>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">
          Retour
        </button>
      </div>
    );
  }

  const isCandidat = profile.role === 'candidat';
  const cv = profile.cv;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Bouton retour */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        {/* Carte de Profil */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header Cover (Couleur de fond) */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

          <div className="px-6 sm:px-10 pb-10">
            {/* Avatar & Badges */}
            <div className="-mt-16 mb-6 flex justify-between items-end">
              <div className="relative">
                {profile.photoProfil ? (
                  <img 
                    src={getImageUrl(profile.photoProfil)} 
                    alt="Profil" 
                    className="w-32 h-32 rounded-full border-4 border-white object-cover bg-slate-100 shadow-md"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center shadow-md">
                    <User className="w-12 h-12 text-slate-400" />
                  </div>
                )}
              </div>
              
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100 mb-4">
                {isCandidat ? 'Candidat' : 'Recruteur'}
              </span>
            </div>

            {/* Infos Principales */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {isCandidat ? `${profile.prenom} ${profile.nom}` : profile.nomEntreprise}
                </h1>
                
                {/* Titre du poste pour les candidats */}
                {isCandidat && cv?.titrePoste && (
                  <p className="text-xl text-blue-600 font-medium mt-1">{cv.titrePoste}</p>
                )}

                {/* Secteur d'activité pour les recruteurs */}
                {!isCandidat && profile.secteurActivite && (
                  <div className="flex items-center gap-2 text-slate-600 mt-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>{profile.secteurActivite}</span>
                  </div>
                )}
              </div>

              {/* Localisation */}
              {profile.adresse && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>
                    {typeof profile.adresse === 'string' 
                      ? profile.adresse 
                      : [profile.adresse.ville, profile.adresse.pays].filter(Boolean).join(', ') || 'Localisation non spécifiée'}
                  </span>
                </div>
              )}

              {/* Ligne de séparation */}
              <div className="h-px w-full bg-slate-100 my-6"></div>

              {/* Bio / Description */}
              <section>
                <h2 className="text-lg font-semibold text-slate-800 mb-2">À propos</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {profile.bio || "Aucune description renseignée pour le moment."}
                </p>
              </section>

              {/* CV Section (Uniquement pour les candidats) */}
              {isCandidat && cv && (
                <div className="space-y-8 mt-8">
                  
                  {/* Expériences */}
                  {cv.experiences?.length > 0 && (
                    <section>
                      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-500" /> Expériences Professionnelles
                      </h2>
                      <div className="space-y-5">
                        {cv.experiences.map((exp, idx) => (
                          <div key={idx} className="border-l-2 border-slate-200 pl-4 py-1 relative before:absolute before:w-2 before:h-2 before:bg-blue-500 before:rounded-full before:-left-[5px] before:top-2">
                            <h3 className="font-bold text-slate-800">{exp.poste}</h3>
                            <div className="text-blue-600 text-sm font-medium mt-0.5">
                              {exp.entreprise} {exp.localisation && <span className="text-slate-400 font-normal">| {exp.localisation}</span>}
                            </div>
                            <p className="text-slate-500 text-xs mt-1 mb-2">
                              {formatDate(exp.dateDebut)} - {exp.enCours ? "Présent" : formatDate(exp.dateFin)}
                            </p>
                            {exp.description && <p className="text-slate-600 text-sm whitespace-pre-line">{exp.description}</p>}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Formations */}
                  {cv.formations?.length > 0 && (
                    <section>
                      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-blue-500" /> Formation
                      </h2>
                      <div className="grid grid-cols-1 gap-4">
                        {cv.formations.map((edu, idx) => (
                          <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <h3 className="font-bold text-slate-800">
                              {edu.diplome} {edu.domaine && <span className="font-normal text-slate-600">en {edu.domaine}</span>}
                            </h3>
                            <p className="text-blue-600 text-sm font-medium mt-1">{edu.etablissement}</p>
                            <p className="text-slate-500 text-xs mt-1">
                              {formatDate(edu.dateDebut)} - {edu.enCours ? "En cours" : formatDate(edu.dateFin)}
                            </p>
                            {edu.description && <p className="text-slate-600 text-sm mt-2">{edu.description}</p>}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Compétences */}
                  {cv.competences?.length > 0 && (
                    <section>
                      <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Star className="w-5 h-5 text-blue-500" /> Compétences
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {cv.competences.map((skill, idx) => (
                          <span key={idx} className="bg-white text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium border border-slate-200 shadow-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Langues */}
                  {cv.langues?.length > 0 && (
                    <section>
                      <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-500" /> Langues
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {cv.langues.map((lang, idx) => (
                          <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-sm font-medium border border-blue-100">
                            {lang.langue} <span className="opacity-75 font-normal ml-1">({lang.niveau})</span>
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}