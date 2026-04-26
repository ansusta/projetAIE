import React, { useState, useEffect, useRef } from 'react';
import {
  User, Save, ChevronLeft, Loader2, Camera,
  Lock, Settings2, X, Plus, Eye, EyeOff, Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

const GENRE_OPTIONS = [
  { value: 'homme',       label: 'Homme'                    },
  { value: 'femme',       label: 'Femme'                    },
  { value: 'nonSpecifie', label: 'Préfère ne pas préciser'  },
];
const CONTRACT_COLOR = {
  CDI:       'bg-blue-50 text-blue-700 border-blue-100',
  CDD:       'bg-amber-50 text-amber-700 border-amber-100',
  stage:     'bg-indigo-50 text-indigo-700 border-indigo-100',
  freelance: 'bg-purple-50 text-purple-700 border-purple-100',
};

export default function EditProfilePage() {
  const navigate     = useNavigate();
  const fileInputRef = useRef(null);

  const [isLoadingProfile,  setIsLoadingProfile]  = useState(false);
  const [isLoadingPrefs,    setIsLoadingPrefs]     = useState(false);
  const [isLoadingPassword, setIsLoadingPassword]  = useState(false);

  const [message,      setMessage]      = useState({ type: '', text: '' });
  const [previewImage, setPreviewImage] = useState(null);

  const [showOld,     setShowOld]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    prenom: '', nom: '', telephone: '', bio: '',
    genre:  'nonSpecifie',
    dateNaissance: '',
    numeroRue: '', nomRue: '', codePostal: '', ville: '',
    photoFile: null,
  });

  const [preferencesData, setPreferencesData] = useState({
    salaireMinSouhaite:      '',
    typesContratSouhaite: [],
    secteursSouhaites:       [],
    localisationsSouhaitees: '',
    disponibilite:           '',
  });

  const secteursOptions = [
    'Informatique / Digital', 'Finance', 'Santé', 'Marketing',
    'Éducation', 'Ingénierie', 'Commerce', 'Juridique', 'Autre',
  ];

  const [passwordData, setPasswordData] = useState({
    ancienMotDePasse: '', nouveauMotDePasse: '', confirmerMotDePasse: '',
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) return;

    setFormData(prev => ({
      ...prev,
      prenom:         storedUser.prenom              || '',
      nom:            storedUser.nom                 || '',
      telephone:      storedUser.telephone           || '',
      bio:            storedUser.bio                 || '',
      genre:          storedUser.genre               || 'nonSpecifie',
      dateNaissance:  storedUser.dateNaissance
        ? new Date(storedUser.dateNaissance).toISOString().split('T')[0]
        : '',
      numeroRue:  storedUser.adresse?.numeroRue  || '',
      nomRue:     storedUser.adresse?.nomRue     || '',
      codePostal: storedUser.adresse?.codePostal || '',
      ville:      storedUser.adresse?.ville      || '',
    }));

    const prefs = storedUser.preferences || {};
    setPreferencesData({
      salaireMinSouhaite: prefs.salaireMinSouhaite || '',
      typesContratSouhaite: Array.isArray(prefs.typesContratSouhaite)
  ? prefs.typesContratSouhaite
  : [],
      secteursSouhaites: Array.isArray(prefs.secteursSouhaites)
        ? prefs.secteursSouhaites : [],
      localisationsSouhaitees: Array.isArray(prefs.localisationsSouhaitees)
        ? prefs.localisationsSouhaitees.join(', ') : '',
      disponibilite: prefs.disponibilite
        ? new Date(prefs.disponibilite).toISOString().split('T')[0] : '',
    });

    if (storedUser.photoProfil) setPreviewImage(storedUser.photoProfil);
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData(prev => ({ ...prev, photoFile: file }));
    setPreviewImage(URL.createObjectURL(file));
  };

  const addSecteur = (s) => {
    if (s && !preferencesData.secteursSouhaites.includes(s))
      setPreferencesData(p => ({ ...p, secteursSouhaites: [...p.secteursSouhaites, s] }));
  };
  const removeSecteur = (s) =>
    setPreferencesData(p => ({
      ...p, secteursSouhaites: p.secteursSouhaites.filter(x => x !== s),
    }));

  const flash = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoadingProfile(true);
    try {
      await authService.updateProfile({
        prenom:         formData.prenom,
        nom:            formData.nom,
        telephone:      formData.telephone,
        bio:            formData.bio,
        genre:          formData.genre,
        dateNaissance:  formData.dateNaissance || undefined,
        adresse: {
          numeroRue:  formData.numeroRue,
          nomRue:     formData.nomRue,
          codePostal: formData.codePostal,
          ville:      formData.ville,
        },
        photoProfil: formData.photoFile || undefined,
      });
      const fresh = await authService.getMe();
      localStorage.setItem('user', JSON.stringify(fresh));
      flash('success', 'Profil mis à jour avec succès !');
    } catch (err) {
      flash('error', err.response?.data?.error || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleUpdatePreferences = async (e) => {
    e.preventDefault();
    setIsLoadingPrefs(true);
    try {
      await authService.updatePreferences({
        salaireMinSouhaite: Number(preferencesData.salaireMinSouhaite) || 0,
        typesContratSouhaite: preferencesData.typesContratSouhaite,
        secteursSouhaites: preferencesData.secteursSouhaites,
        localisationsSouhaitees: preferencesData.localisationsSouhaitees
          .split(',').map(s => s.trim()).filter(Boolean),
        disponibilite: preferencesData.disponibilite || null,
      });
      const fresh = await authService.getMe();
      localStorage.setItem('user', JSON.stringify(fresh));
      flash('success', 'Préférences enregistrées !');
    } catch (err) {
      flash('error', err.response?.data?.error || 'Erreur lors de la mise à jour.');
    } finally {
      setIsLoadingPrefs(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.nouveauMotDePasse !== passwordData.confirmerMotDePasse)
      return flash('error', 'Les nouveaux mots de passe ne correspondent pas.');
    if (passwordData.nouveauMotDePasse.length < 6)
      return flash('error', 'Le mot de passe doit contenir au moins 6 caractères.');
    setIsLoadingPassword(true);
    try {
      await authService.changePassword({
        ancienMotDePasse:  passwordData.ancienMotDePasse,
        nouveauMotDePasse: passwordData.nouveauMotDePasse,
      });
      flash('success', 'Mot de passe modifié avec succès !');
      setPasswordData({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmerMotDePasse: '' });
    } catch (err) {
      flash('error', err.response?.data?.error || 'Mot de passe actuel incorrect.');
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const inp = 'w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-700 bg-white transition-shadow';

  const PasswordField = ({ label, value, show, onToggle, onChange, hint }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          placeholder="••••••••"
          className={`${inp} pr-12 ${
            label.includes('Confirmer') && value
              ? value === passwordData.nouveauMotDePasse
                ? 'border-green-400 focus:ring-green-400'
                : 'border-red-400 focus:ring-red-400'
              : ''
          }`}
          value={value}
          onChange={onChange}
        />
        <button type="button" onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      {label.includes('Confirmer') && value && (
        <p className={`text-xs mt-1 ${value === passwordData.nouveauMotDePasse ? 'text-green-600' : 'text-red-500'}`}>
          {value === passwordData.nouveauMotDePasse
            ? '✓ Les mots de passe correspondent'
            : 'Les mots de passe ne correspondent pas'}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <input
        ref={fileInputRef} type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden" onChange={handlePhotoChange}
      />

      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')}
            className="p-2 bg-white hover:bg-slate-100 rounded-full shadow-sm transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Paramètres</h2>
            <p className="text-slate-500 text-sm">Gérez votre profil et vos préférences</p>
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl text-sm font-medium shadow-md ${
            message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {message.text}
          </div>
        )}

        {/* ── Informations personnelles ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <User className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-slate-800">Informations Personnelles</h3>
          </div>
          <form onSubmit={handleUpdateProfile} className="space-y-6">

            {/* Photo */}
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                  {previewImage
                    ? <img src={previewImage} alt="Profil" className="w-full h-full object-cover" />
                    : <User className="w-10 h-10 text-blue-300" />}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full shadow-md hover:bg-blue-700 transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Photo de profil</p>
                <p className="text-xs text-slate-400 mt-0.5">JPG, PNG ou WebP · max 10 Mo</p>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-blue-600 font-semibold hover:underline mt-1 block">
                  Changer la photo
                </button>
              </div>
            </div>

            {/* Nom / Prénom */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Prénom</label>
                <input type="text" className={inp} value={formData.prenom}
                  onChange={e => setFormData({ ...formData, prenom: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nom</label>
                <input type="text" className={inp} value={formData.nom}
                  onChange={e => setFormData({ ...formData, nom: e.target.value })} />
              </div>
            </div>

            {/* Téléphone / Date de naissance */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
                <input type="tel" placeholder="06 12 34 56 78" className={inp}
                  value={formData.telephone}
                  onChange={e => setFormData({ ...formData, telephone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Date de naissance
                  <span className="text-xs font-normal text-slate-400">(pour les filtres d'offres)</span>
                </label>
                <input type="date" className={inp}
                  value={formData.dateNaissance}
                  onChange={e => setFormData({ ...formData, dateNaissance: e.target.value })} />
              </div>
            </div>

            {/* Genre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Genre
                <span className="ml-2 text-xs font-normal text-slate-400">
                  (utilisé pour le filtrage des offres)
                </span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {GENRE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, genre: opt.value })}
                    className={`px-3 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      formData.genre === opt.value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {formData.genre === opt.value && <span className="mr-1">✓</span>}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
              <textarea rows={3} className={inp} placeholder="Présentez-vous en quelques mots…"
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })} />
            </div>

            {/* Address */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <p className="text-sm font-semibold text-slate-700">Adresse</p>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">N°</label>
                  <input type="text" placeholder="12" className={inp} value={formData.numeroRue}
                    onChange={e => setFormData({ ...formData, numeroRue: e.target.value })} />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Rue</label>
                  <input type="text" placeholder="Rue de la République" className={inp}
                    value={formData.nomRue}
                    onChange={e => setFormData({ ...formData, nomRue: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Code postal</label>
                  <input type="text" placeholder="16000" className={inp} value={formData.codePostal}
                    onChange={e => setFormData({ ...formData, codePostal: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Ville</label>
                  <input type="text" placeholder="Alger" className={inp} value={formData.ville}
                    onChange={e => setFormData({ ...formData, ville: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={isLoadingProfile}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 transition-all">
                {isLoadingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer
              </button>
            </div>
          </form>
        </div>

        {/* ── Préférences ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <Settings2 className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-bold text-slate-800">Préférences de Recherche</h3>
          </div>
          <form onSubmit={handleUpdatePreferences} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Secteurs souhaités</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none mb-3 bg-slate-50 text-slate-700"
                onChange={e => { addSecteur(e.target.value); e.target.value = ''; }}
                defaultValue="">
                <option value="" disabled>Choisir un secteur…</option>
                {secteursOptions.map(opt => (
                  <option key={opt} value={opt}
                    disabled={preferencesData.secteursSouhaites.includes(opt)}>
                    {opt}{preferencesData.secteursSouhaites.includes(opt) ? ' ✓' : ''}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl min-h-[50px]">
                {preferencesData.secteursSouhaites.length > 0 ? (
                  preferencesData.secteursSouhaites.map((s, i) => (
                    <span key={i} className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium border border-indigo-200">
                      {s}
                      <button type="button" onClick={() => removeSecteur(s)}
                        className="hover:bg-indigo-200 rounded-full p-0.5">
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
  <label className="block text-sm font-medium text-slate-700 mb-2">
    Types de contrat
  </label>

  <div className="flex flex-wrap gap-2">
    {Object.keys(CONTRACT_COLOR).map((type) => {
      const isSelected = preferencesData.typesContratSouhaite.includes(type);

      return (
        <button
          key={type}
          type="button"
          onClick={() => {
            const updated = isSelected
              ? preferencesData.typesContratSouhaite.filter(t => t !== type) // remove
              : [...preferencesData.typesContratSouhaite, type]; // add

            setPreferencesData({
              ...preferencesData,
              typesContratSouhaite: updated,
            });
          }}
          className={`px-3 py-1 rounded-full border text-sm transition ${
            CONTRACT_COLOR[type]
          } ${
            isSelected
              ? "ring-2 ring-offset-1 ring-slate-400 scale-105"
              : "opacity-70 hover:opacity-100"
          }`}
        >
          {type}
        </button>
      );
    })}
  </div>
</div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Localisations souhaitées</label>
                <input type="text" placeholder="ex: Alger, Oran, Remote" className={inp}
                  value={preferencesData.localisationsSouhaitees}
                  onChange={e => setPreferencesData({ ...preferencesData, localisationsSouhaitees: e.target.value })} />
                <p className="text-xs text-slate-400 mt-1">Séparez par des virgules</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Salaire minimum (DZD / an)</label>
                <input type="number" placeholder="ex: 150 000" className={inp}
                  value={preferencesData.salaireMinSouhaite}
                  onChange={e => setPreferencesData({ ...preferencesData, salaireMinSouhaite: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Disponibilité</label>
                <input type="date" className={inp}
                  value={preferencesData.disponibilite}
                  onChange={e => setPreferencesData({ ...preferencesData, disponibilite: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={isLoadingPrefs}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-all">
                {isLoadingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer les préférences
              </button>
            </div>
          </form>
        </div>

        {/* ── Sécurité ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <Lock className="w-6 h-6 text-slate-700" />
            <h3 className="text-xl font-bold text-slate-800">Sécurité</h3>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <PasswordField label="Mot de passe actuel"
              value={passwordData.ancienMotDePasse} show={showOld}
              onToggle={() => setShowOld(v => !v)}
              onChange={e => setPasswordData({ ...passwordData, ancienMotDePasse: e.target.value })} />
            <PasswordField label="Nouveau mot de passe"
              value={passwordData.nouveauMotDePasse} show={showNew}
              onToggle={() => setShowNew(v => !v)}
              onChange={e => setPasswordData({ ...passwordData, nouveauMotDePasse: e.target.value })}
              hint="Minimum 6 caractères" />
            <PasswordField label="Confirmer le nouveau mot de passe"
              value={passwordData.confirmerMotDePasse} show={showConfirm}
              onToggle={() => setShowConfirm(v => !v)}
              onChange={e => setPasswordData({ ...passwordData, confirmerMotDePasse: e.target.value })} />
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={isLoadingPassword}
                className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-slate-900 disabled:opacity-60 transition-all">
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