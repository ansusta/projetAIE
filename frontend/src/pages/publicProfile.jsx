import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Building, Briefcase, ArrowLeft, Loader2, User } from 'lucide-react';
import { authService } from '../services/auth.service';

// Petit helper pour l'image (si vous l'avez déjà ailleurs, vous pouvez l'importer)
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${path}`;
};

export default function PublicProfile() {
  const { id } = useParams(); // Récupère l'ID depuis l'URL
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

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Bouton retour */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        {/* Carte de Profil */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header Cover (Couleur de fond) */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

          <div className="px-6 sm:px-10 pb-10">
            {/* Avatar */}
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
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {isCandidat ? `${profile.prenom} ${profile.nom}` : profile.nomEntreprise}
                </h1>
                
                {/* Secteur d'activité pour les recruteurs */}
                {!isCandidat && profile.secteurActivite && (
                  <div className="flex items-center gap-2 text-slate-600 mt-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span>{profile.secteurActivite}</span>
                  </div>
                )}
              </div>

              {/* Localisation */}
              {profile.adresse && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>
                    {[profile.adresse.ville, profile.adresse.pays].filter(Boolean).join(', ') || 'Localisation non spécifiée'}
                  </span>
                </div>
              )}

              {/* Ligne de séparation */}
              <div className="h-px w-full bg-slate-100 my-6"></div>

              {/* Bio / Description */}
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-2">À propos</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {profile.bio || "Aucune description renseignée pour le moment."}
                </p>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}