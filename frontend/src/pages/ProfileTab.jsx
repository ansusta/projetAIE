import React, { useState, useEffect } from 'react';
// 1. Added Settings2 to the imports!
import { User, MapPin, Mail, Phone, FileText, Edit2, Download, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfileTab() {
  const navigate = useNavigate();
  const [user, setUser] = useState({});

  // Fetch the REAL user data from local storage when the tab loads
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  // Helper function to format the address from your backend structure
  const formatLocation = () => {
    if (!user.adresse) return "Non renseigné";
    const parts = [user.adresse.ville, user.adresse.codePostal].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : "Non renseigné";
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mon Profil</h2>
          <p className="text-slate-500">Gérez vos informations et votre CV</p>
        </div>
        
        {/* Redirect to the dedicated Edit Profile Page */}
        <button 
          onClick={() => navigate('/edit-profile')}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-sm"
        >
          <Edit2 className="w-4 h-4" />
          Modifier le profil
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Identity Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            
            {/* Profile Photo showing the real image if it exists */}
            <div className="w-32 h-32 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-lg overflow-hidden">
              {user.photoProfil ? (
                <img src={user.photoProfil} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16" />
              )}
            </div>
            
            {/* REAL Names from Database */}
            <h3 className="text-xl font-bold text-slate-900">
              {user.prenom || 'Prénom'} {user.nom || 'Nom'}
            </h3>
            <p className="text-blue-600 font-medium mb-4">{user.titreProf || 'Candidat'}</p>
            
            <div className="w-full h-px bg-slate-100 mb-4"></div>
            
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

          {/* CV Document Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Mon CV
            </h4>
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-slate-800 truncate">CV_{user.prenom || 'User'}.pdf</p>
                  <p className="text-xs text-slate-500">Gérer mon document</p>
                </div>
              </div>
              <Download className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Bio & Preferences */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* About Me */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              À propos de moi
            </h4>
            <p className="text-slate-600 leading-relaxed">
              {user.bio || "Vous n'avez pas encore ajouté de description. Cliquez sur 'Modifier le profil' pour vous présenter aux recruteurs."}
            </p>
          </div>

          {/* 2. Moved PREFERENCES DE RECHERCHE safely inside the JSX return block! */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-500" />
              Préférences de recherche
            </h4>
            
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <p className="text-sm text-slate-500 mb-1">Salaire minimum souhaité</p>
                <p className="font-semibold text-slate-800">
                  {user?.preferences?.salaireMinSouhaite ? `${user.preferences.salaireMinSouhaite.toLocaleString('fr-FR')} dzd / an` : 'Non renseigné'}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Disponibilité</p>
                <p className="font-semibold text-slate-800">
                  {user?.preferences?.disponibilite ? new Date(user.preferences.disponibilite).toLocaleDateString('fr-FR') : 'Non renseignée'}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm text-slate-500 mb-2">Types de contrat</p>
                <div className="flex flex-wrap gap-2">
                  {user?.preferences?.typesContratSouhaite?.length > 0 ? (
                    user.preferences.typesContratSouhaite.map((type, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
                        {type}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400 italic">Non renseigné</span>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm text-slate-500 mb-2">Secteurs souhaités</p>
                <div className="flex flex-wrap gap-2">
                  {user?.preferences?.secteursSouhaites?.length > 0 ? (
                    user.preferences.secteursSouhaites.map((secteur, i) => (
                      <span key={i} className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium">
                        {secteur}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400 italic">Non renseigné</span>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm text-slate-500 mb-2">Localisations souhaitées</p>
                <div className="flex flex-wrap gap-2">
                  {user?.preferences?.localisationsSouhaitees?.length > 0 ? (
                    user.preferences.localisationsSouhaitees.map((loc, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {loc}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400 italic">Non renseigné</span>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}