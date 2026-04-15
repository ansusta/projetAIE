import React, { useState, useEffect, useRef } from 'react';
import {
  User, Save, ChevronLeft, Loader2, Camera,
  Lock, Settings2, X, Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs]     = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  const [message, setMessage]       = useState({ type: '', text: '' });
  const [previewImage, setPreviewImage] = useState(null);

  const [formData, setFormData] = useState({
    prenom: '', nom: '', telephone: '', bio: '',
    numeroRue: '', nomRue: '', codePostal: '', ville: '',
    photoFile: null,   // File object for upload
  });

  const [preferencesData, setPreferencesData] = useState({
    salaireMinSouhaite: '',
    typesContratSouhaite: '',
    secteursSouhaites: [],
    localisationsSouhaitees: '',
    disponibilite: '',
  });

  const secteursOptions = [
    'Informatique / Digital', 'Finance', 'Santé', 'Marketing',
    'Éducation', 'Ingénierie', 'Commerce', 'Autre',
  ];

  const [passwordData, setPasswordData] = useState({
    ancienMotDePasse: '', nouveauMotDePasse: '', confirmerMotDePasse: '',
  });

  // ── Load stored user data ─────────────────────────────────────────────────
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) return;

    setFormData((prev) => ({
      ...prev,
      prenom:    storedUser.prenom    || '',
      nom:       storedUser.nom       || '',
      telephone: storedUser.telephone || '',
      bio:       storedUser.bio       || '',
      numeroRue: storedUser.adresse?.numeroRue || '',
      nomRue:    storedUser.adresse?.nomRue    || '',
      codePostal: storedUser.adresse?.codePostal || '',
      ville:     storedUser.adresse?.ville     || '',
    }));

    const prefs = storedUser.preferences || {};
    setPreferencesData({
      salaireMinSouhaite:    prefs.salaireMinSouhaite || '',
      typesContratSouhaite:  Array.isArray(prefs.typesContratSouhaite)
        ? prefs.typesContratSouhaite.join(', ')
        : '',
      secteursSouhaites:     Array.isArray(prefs.secteursSouhaites)
        ? prefs.secteursSouhaites
        : [],
      localisationsSouhaitees: Array.isArray(prefs.localisationsSouhaitees)
        ? prefs.localisationsSouhaitees.join(', ')
        : '',
      disponibilite: prefs.disponibilite
        ? new Date(prefs.disponibilite).toISOString().split('T')[0]
        : '',
    });

    if (storedUser.photoProfil) setPreviewImage(storedUser.photoProfil);
  }, []);

  // ── Photo selection ───────────────────────────────────────────────────────
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, photoFile: file }));
    setPreviewImage(URL.createObjectURL(file));
  };

  // ── Sector tag helpers ────────────────────────────────────────────────────
  const addSecteur = (secteur) => {
    if (secteur && !preferencesData.secteursSouhaites.includes(secteur)) {
      setPreferencesData((p) => ({
        ...p,
        secteursSouhaites: [...p.secteursSouhaites, secteur],
      }));
    }
  };
  const removeSecteur = (s) =>
    setPreferencesData((p) => ({
      ...p,
      secteursSouhaites: p.secteursSouhaites.filter((x) => x !== s),
    }));

  const displayMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // ── Submit: personal info ─────────────────────────────────────────────────
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoadingProfile(true);
    try {
      const payload = {
        prenom:    formData.prenom,
        nom:       formData.nom,
        telephone: formData.telephone,
        bio:       formData.bio,
        adresse: {
          numeroRue:  formData.numeroRue,
          nomRue:     formData.nomRue,
          codePostal: formData.codePostal,
          ville:      formData.ville,
        },
        // authService.updateProfile builds FormData and appends the file when present
        photoProfil: formData.photoFile || undefined,
      };
      await authService.updateProfile(payload);
      const fresh = await authService.getMe();
      localStorage.setItem('user', JSON.stringify(fresh));
      displayMessage('success', 'Profil mis à jour !');
    } catch {
      displayMessage('error', 'Erreur lors de la mise à jour du profil.');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // ── Submit: preferences ───────────────────────────────────────────────────
  const handleUpdatePreferences = async (e) => {
    e.preventDefault();
    setIsLoadingPrefs(true);
    try {
      const prefsPayload = {
        salaireMinSouhaite: Number(preferencesData.salaireMinSouhaite) || 0,
        typesContratSouhaite: preferencesData.typesContratSouhaite
          .split(',').map((s) => s.trim()).filter(Boolean),
        secteursSouhaites: preferencesData.secteursSouhaites,
        localisationsSouhaitees: preferencesData.localisationsSouhaitees
          .split(',').map((s) => s.trim()).filter(Boolean),
        disponibilite: preferencesData.disponibilite || null,
      };
      await authService.updatePreferences(prefsPayload);
      const fresh = await authService.getMe();
      localStorage.setItem('user', JSON.stringify(fresh));
      displayMessage('success', 'Préférences enregistrées !');
    } catch {
      displayMessage('error', 'Erreur lors de la mise à jour des préférences.');
    } finally {
      setIsLoadingPrefs(false);
    }
  };

  // ── Submit: password ──────────────────────────────────────────────────────
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.nouveauMotDePasse !== passwordData.confirmerMotDePasse)
      return displayMessage('error', 'Les mots de passe ne correspondent pas.');
    if (passwordData.nouveauMotDePasse.length < 6)
      return displayMessage('error', 'Le nouveau mot de passe doit contenir au moins 6 caractères.');
    setIsLoadingPassword(true);
    try {
      await authService.changePassword({
        ancienMotDePasse:  passwordData.ancienMotDePasse,
        nouveauMotDePasse: passwordData.nouveauMotDePasse,
      });
      displayMessage('success', 'Mot de passe modifié !');
      setPasswordData({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmerMotDePasse: '' });
    } catch (err) {
      displayMessage(
        'error',
        err.response?.data?.error || 'Mot de passe actuel incorrect.',
      );
    } finally {
      setIsLoadingPassword(false);
    }
  };

  // ── Shared input style ────────────────────────────────────────────────────
  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-700';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handlePhotoChange}
      />

      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 bg-white hover:bg-slate-100 rounded-full shadow-sm"
          >
            <ChevronLeft className="w-6 h-6 text-slate-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Paramètres</h2>
            <p className="text-slate-500 text-sm">Gérez votre profil et vos préférences</p>
          </div>
        </div>

        {message.text && (
          <div
            className={`p-4 rounded-xl text-sm font-medium shadow-md ${
              message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* ── SECTION 1 : Personal Info ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <User className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-slate-800">Informations Personnelles</h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Profile photo */}
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                  {previewImage ? (
                    <img src={previewImage} alt="Photo de profil" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-blue-300" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full shadow-md hover:bg-blue-700 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Photo de profil</p>
                <p className="text-xs text-slate-400 mt-1">JPG, PNG ou WebP · max 10 Mo</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-blue-600 font-semibold hover:underline mt-1"
                >
                  Changer la photo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Prénom</label>
                <input
                  type="text"
                  className={inputCls}
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nom</label>
                <input
                  type="text"
                  className={inputCls}
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
              <input
                type="tel"
                className={inputCls}
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="06 12 34 56 78"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
              <textarea
                rows={3}
                className={inputCls}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Présentez-vous en quelques mots…"
              />
            </div>

            {/* Address */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              <p className="text-sm font-semibold text-slate-700">Adresse</p>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">N°</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={formData.numeroRue}
                    onChange={(e) => setFormData({ ...formData, numeroRue: e.target.value })}
                    placeholder="12"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Rue</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={formData.nomRue}
                    onChange={(e) => setFormData({ ...formData, nomRue: e.target.value })}
                    placeholder="Rue de la Paix"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Code postal</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={formData.codePostal}
                    onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                    placeholder="75000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Ville</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                    placeholder="Paris"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoadingProfile}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 transition-all"
              >
                {isLoadingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Enregistrer
              </button>
            </div>
          </form>
        </div>

        {/* ── SECTION 2 : Preferences ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <Settings2 className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-bold text-slate-800">Préférences de Recherche</h3>
          </div>

          <form onSubmit={handleUpdatePreferences} className="space-y-6">
            {/* Secteurs tag UI */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Secteurs souhaités</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none mb-3 bg-slate-50 text-slate-700"
                onChange={(e) => { addSecteur(e.target.value); e.target.value = ''; }}
                defaultValue=""
              >
                <option value="" disabled>Choisir un secteur à ajouter…</option>
                {secteursOptions.map((opt) => (
                  <option
                    key={opt}
                    value={opt}
                    disabled={preferencesData.secteursSouhaites.includes(opt)}
                  >
                    {opt} {preferencesData.secteursSouhaites.includes(opt) ? '✓' : ''}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl min-h-[50px]">
                {preferencesData.secteursSouhaites.length > 0 ? (
                  preferencesData.secteursSouhaites.map((secteur, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium border border-indigo-200"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Types de contrat</label>
                <input
                  type="text"
                  placeholder="ex: CDI, Freelance"
                  className={inputCls}
                  value={preferencesData.typesContratSouhaite}
                  onChange={(e) =>
                    setPreferencesData({ ...preferencesData, typesContratSouhaite: e.target.value })
                  }
                />
                <p className="text-xs text-slate-400 mt-1">Séparez par des virgules</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Localisations</label>
                <input
                  type="text"
                  placeholder="ex: Paris, Lyon, Remote"
                  className={inputCls}
                  value={preferencesData.localisationsSouhaitees}
                  onChange={(e) =>
                    setPreferencesData({ ...preferencesData, localisationsSouhaitees: e.target.value })
                  }
                />
                <p className="text-xs text-slate-400 mt-1">Séparez par des virgules</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Salaire minimum attendu (DZD)
                </label>
                <input
                  type="number"
                  placeholder="ex: 150000"
                  className={inputCls}
                  value={preferencesData.salaireMinSouhaite}
                  onChange={(e) =>
                    setPreferencesData({ ...preferencesData, salaireMinSouhaite: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Disponibilité</label>
                <input
                  type="date"
                  className={inputCls}
                  value={preferencesData.disponibilite}
                  onChange={(e) =>
                    setPreferencesData({ ...preferencesData, disponibilite: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoadingPrefs}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-all"
              >
                {isLoadingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer les préférences
              </button>
            </div>
          </form>
        </div>

        {/* ── SECTION 3 : Password ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <Lock className="w-6 h-6 text-slate-700" />
            <h3 className="text-xl font-bold text-slate-800">Sécurité</h3>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe actuel</label>
              <input
                type="password"
                className={inputCls}
                value={passwordData.ancienMotDePasse}
                onChange={(e) => setPasswordData({ ...passwordData, ancienMotDePasse: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  className={inputCls}
                  value={passwordData.nouveauMotDePasse}
                  onChange={(e) => setPasswordData({ ...passwordData, nouveauMotDePasse: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirmer</label>
                <input
                  type="password"
                  className={inputCls}
                  value={passwordData.confirmerMotDePasse}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmerMotDePasse: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoadingPassword}
                className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-slate-900 disabled:opacity-60 transition-all"
              >
                {isLoadingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Modifier le mot de passe
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}