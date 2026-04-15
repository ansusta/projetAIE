import React, { useState, useEffect, useRef } from 'react';
import { User, Save, ChevronLeft, Loader2, MapPin, Camera, Lock, Settings2, X, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  return `http://localhost:5000${path}`;
};

export default function EditProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [previewImage, setPreviewImage] = useState(null);
  
  const [formData, setFormData] = useState({
    prenom: '', nom: '', telephone: '', numeroRue: '', nomRue: '', codePostal: '', ville: '', bio: '', photoProfil: null
  });

  // Preferences State
  const [preferencesData, setPreferencesData] = useState({
    salaireMinSouhaite: '',
    typesContratSouhaite: '',
    secteursSouhaites: [], // Array for AO3 style tags
    localisationsSouhaitees: '',
    disponibilite: ''
  });

  const secteursOptions = ["Informatique / Digital", "Finance", "Santé", "Autre"];

  const [passwordData, setPasswordData] = useState({
    ancienMotDePasse: '', nouveauMotDePasse: '', confirmerMotDePasse: ''
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setFormData(prev => ({
        ...prev,
        prenom: storedUser.prenom || '',
        nom: storedUser.nom || '',
        telephone: storedUser.telephone || '',
        numeroRue: storedUser.adresse?.numeroRue || '',
        nomRue: storedUser.adresse?.nomRue || '',
        codePostal: storedUser.adresse?.codePostal || '',
        ville: storedUser.adresse?.ville || '',
        bio: storedUser.bio || ''
      }));
      
      const prefs = storedUser.preferences || {};
      setPreferencesData({
        salaireMinSouhaite: prefs.salaireMinSouhaite || '',
        typesContratSouhaite: prefs.typesContratSouhaite ? prefs.typesContratSouhaite.join(', ') : '',
        secteursSouhaites: Array.isArray(prefs.secteursSouhaites) ? prefs.secteursSouhaites : [],
        localisationsSouhaitees: prefs.localisationsSouhaitees ? prefs.localisationsSouhaitees.join(', ') : '',
        disponibilite: prefs.disponibilite ? prefs.disponibilite.split('T')[0] : '' 
      });

      if (storedUser.photoProfil) {
        setPreviewImage(getImageUrl(storedUser.photoProfil));
      }
    }
  }, []);

  // --- TAG HELPERS ---
  const addSecteur = (secteur) => {
    if (secteur && !preferencesData.secteursSouhaites.includes(secteur)) {
      setPreferencesData({
        ...preferencesData,
        secteursSouhaites: [...preferencesData.secteursSouhaites, secteur]
      });
    }
  };

  const removeSecteur = (secteurToRemove) => {
    setPreferencesData({
      ...preferencesData,
      secteursSouhaites: preferencesData.secteursSouhaites.filter(s => s !== secteurToRemove)
    });
  };

  const displayMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoadingProfile(true);
    try {
      const payload = {
        prenom: formData.prenom, nom: formData.nom, telephone: formData.telephone, bio: formData.bio, photoProfil: formData.photoProfil,
        adresse: { numeroRue: formData.numeroRue, nomRue: formData.nomRue, codePostal: formData.codePostal, ville: formData.ville }
      };
      await authService.updateProfile(payload);
      const updatedData = await authService.getMe();
      localStorage.setItem('user', JSON.stringify(updatedData.user || updatedData));
      displayMessage('success', 'Profil mis à jour !');
    } catch (error) {
      displayMessage('error', "Erreur lors de la mise à jour.");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleUpdatePreferences = async (e) => {
    e.preventDefault();
    setIsLoadingPrefs(true);
    try {
      const prefsPayload = {
        salaireMinSouhaite: Number(preferencesData.salaireMinSouhaite) || 0,
        typesContratSouhaite: preferencesData.typesContratSouhaite.split(',').map(s => s.trim()).filter(Boolean),
        secteursSouhaites: preferencesData.secteursSouhaites, // Already an array
        localisationsSouhaitees: preferencesData.localisationsSouhaitees.split(',').map(s => s.trim()).filter(Boolean),
        disponibilite: preferencesData.disponibilite || null
      };

      await authService.updatePreferences(prefsPayload);
      const updatedData = await authService.getMe();
      localStorage.setItem('user', JSON.stringify(updatedData.user || updatedData));
      displayMessage('success', 'Préférences enregistrées !');
    } catch (error) {
      displayMessage('error', "Erreur lors de la mise à jour.");
    } finally {
      setIsLoadingPrefs(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.nouveauMotDePasse !== passwordData.confirmerMotDePasse) {
      return displayMessage('error', "Les mots de passe ne correspondent pas.");
    }
    setIsLoadingPassword(true);
    try {
      await authService.changePassword({
        ancienMotDePasse: passwordData.ancienMotDePasse, nouveauMotDePasse: passwordData.nouveauMotDePasse
      });
      displayMessage('success', 'Mot de passe modifié !');
      setPasswordData({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmerMotDePasse: '' });
    } catch (error) {
      displayMessage('error', "Erreur mot de passe.");
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-white hover:bg-slate-100 rounded-full shadow-sm">
            <ChevronLeft className="w-6 h-6 text-slate-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Paramètres</h2>
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl text-sm font-medium shadow-md ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {message.text}
          </div>
        )}

        {/* SECTION 1: Personal Info */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <User className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-slate-800">Informations Personnelles</h3>
          </div>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Prénom</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200" value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nom</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200" value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold">Enregistrer</button>
            </div>
          </form>
        </div>

        {/* SECTION 2: PREFERENCES */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <Settings2 className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-bold text-slate-800">Préférences de Recherche</h3>
          </div>
          
          <form onSubmit={handleUpdatePreferences} className="space-y-6">
            <div className="space-y-6">
              
              {/* SECTEURS TAGS UI */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Secteurs souhaités</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none mb-3 bg-slate-50"
                  onChange={(e) => {
                    addSecteur(e.target.value);
                    e.target.value = ""; 
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Choisir un secteur à ajouter...</option>
                  {secteursOptions.map(opt => (
                    <option key={opt} value={opt} disabled={preferencesData.secteursSouhaites.includes(opt)}>
                      {opt} {preferencesData.secteursSouhaites.includes(opt) ? '✓' : ''}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl min-h-[50px]">
                  {preferencesData.secteursSouhaites.length > 0 ? (
                    preferencesData.secteursSouhaites.map((secteur, index) => (
                      <span 
                        key={index} 
                        className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium border border-indigo-200 group animate-in fade-in zoom-in duration-200"
                      >
                        {secteur}
                        <button 
                          type="button" 
                          onClick={() => removeSecteur(secteur)}
                          className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Aucun secteur sélectionné
                    </p>
                  )}
                </div>
              </div>

              {/* THE REST OF THE PREFERENCES (RESTORED!) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Types de contrat</label>
                  <input type="text" placeholder="Ex: CDI, Freelance" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700" 
                    value={preferencesData.typesContratSouhaite} onChange={(e) => setPreferencesData({...preferencesData, typesContratSouhaite: e.target.value})} />
                  <p className="text-xs text-slate-400 mt-1">Séparez les valeurs par des virgules</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Localisations</label>
                  <input type="text" placeholder="Ex: Paris, Lyon, Remote" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700" 
                    value={preferencesData.localisationsSouhaitees} onChange={(e) => setPreferencesData({...preferencesData, localisationsSouhaitees: e.target.value})} />
                  <p className="text-xs text-slate-400 mt-1">Séparez les valeurs par des virgules</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Salaire minimum attendu (€)</label>
                  <input type="number" placeholder="Ex: 45000" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700" 
                    value={preferencesData.salaireMinSouhaite} onChange={(e) => setPreferencesData({...preferencesData, salaireMinSouhaite: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Disponibilité</label>
                  <input type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700" 
                    value={preferencesData.disponibilite} onChange={(e) => setPreferencesData({...preferencesData, disponibilite: e.target.value})} />
                </div>

              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button type="submit" disabled={isLoadingPrefs} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all">
                {isLoadingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Enregistrer les préférences
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 3: Password */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <Lock className="w-6 h-6 text-slate-700" />
            <h3 className="text-xl font-bold text-slate-800">Sécurité</h3>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <input type="password" placeholder="Mot de passe actuel" className="w-full px-4 py-3 rounded-xl border border-slate-200" value={passwordData.ancienMotDePasse} onChange={(e) => setPasswordData({...passwordData, ancienMotDePasse: e.target.value})} />
            <div className="grid grid-cols-2 gap-6">
              <input type="password" placeholder="Nouveau" className="w-full px-4 py-3 rounded-xl border border-slate-200" value={passwordData.nouveauMotDePasse} onChange={(e) => setPasswordData({...passwordData, nouveauMotDePasse: e.target.value})} />
              <input type="password" placeholder="Confirmer" className="w-full px-4 py-3 rounded-xl border border-slate-200" value={passwordData.confirmerMotDePasse} onChange={(e) => setPasswordData({...passwordData, confirmerMotDePasse: e.target.value})} />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-semibold">Modifier</button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}