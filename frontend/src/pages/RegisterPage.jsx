import React, { useState } from 'react';
import { User, Briefcase, Eye, EyeOff, ChevronLeft, Upload, MapPin, Calendar, FileText, CheckCircle, Building, Globe, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/Logo'; 


export default function RegisterPage() {
  // --- STATE MANAGEMENT ---
  // step 0: Role Selection | step 1-4: Registration Steps
// Catch any routing data sent from the Landing Page
  const location = useLocation();
  const initialRole = location.state?.role || null;

  // If a role was passed in, skip to Step 1. Otherwise, start at Step 0.
  const [step, setStep] = useState(initialRole ? 1 : 0);
  const [role, setRole] = useState(initialRole);

  const [showPassword, setShowPassword] = useState(false);
  
  // We will store all form data here so it isn't lost between steps
const [formData, setFormData] = useState({
    // Shared
    email: '',
    password: '',
    phone: '',
    firstName: '',
    lastName: '',
    streetNumber: '',
    streetName: '',
    zipCode: '',
    city: '',
    country: 'France',
    // Candidate specific
    birthDate: '',
    // Recruiter specific
    companyName: '',
    industry: '',
    companySize: '',
    website: '',
  });

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  // --- RENDER HELPERS ---

  // STEP 0: Role Selection
  const renderRoleSelection = () => (
    <div className="flex flex-col items-center animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-blue-600 tracking-tight mb-2">MatchTalent</h1>
        <p className="text-slate-500 font-medium">Votre plateforme de recrutement intelligente</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Candidate Card */}
        <button 
          onClick={() => { setRole('candidate'); setStep(1); }}
          className="bg-white p-10 rounded-3xl shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:shadow-blue-900/10 transition-all border-2 border-transparent hover:border-blue-100 group text-center flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <User className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Je cherche un emploi</h2>
          <p className="text-slate-500 text-sm">Créez votre profil candidat et trouvez les opportunités qui vous correspondent</p>
        </button>

        {/* Recruiter Card */}
        <button 
          onClick={() => { setRole('recruiter'); setStep(1); }}
          className="bg-white p-10 rounded-3xl shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:shadow-blue-900/10 transition-all border-2 border-transparent hover:border-indigo-100 group text-center flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Briefcase className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Je recrute des talents</h2>
          <p className="text-slate-500 text-sm">Publiez vos offres et découvrez les meilleurs candidats pour votre entreprise</p>
        </button>
      </div>

      <div className="mt-12">
        <a href="#" className="text-blue-600 font-semibold hover:underline">Déjà inscrit ? Se connecter</a>
      </div>
    </div>
  );

  // STEP 1: Credentials
  const renderStep1 = () => (
    <div className="bg-white p-10 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-xl animate-fade-in">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Créez votre compte</h2>
      <p className="text-slate-500 mb-8">Commençons par vos informations de connexion</p>

      <div className="space-y-6">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Adresse email</label>
          <input 
            type="email" 
            placeholder="exemple@email.com"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Créez un mot de passe sécurisé"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all pr-12"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            <button 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Numéro de téléphone</label>
          <div className="flex gap-3">
            <select className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-600 outline-none w-32">
              <option>🇫🇷 +33</option>
              <option>🇩🇿 +213</option>
              <option>🇺🇸 +1</option>
            </select>
            <input 
              type="tel" 
              placeholder="6 12 34 56 78"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-10">
        <button onClick={handleBack} className="flex items-center text-slate-500 hover:text-slate-800 font-medium transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Retour
        </button>
        <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors w-1/2">
          Continuer
        </button>
      </div>
    </div>
  );
  // STEP 2: Profile
  const renderStep2 = () => (
    <div className="bg-white p-10 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-xl animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <User className="w-8 h-8 text-blue-600" />
        <h2 className="text-3xl font-bold text-slate-900">Votre profil</h2>
      </div>
      <p className="text-slate-500 mb-8">Parlez-nous un peu de vous</p>

      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Prénom</label>
            <input 
              type="text" placeholder="Prénom"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Nom</label>
            <input 
              type="text" placeholder="Nom"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Date de naissance</label>
          <div className="relative">
            <input 
              type="text" placeholder="jj / mm / aaaa"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
              value={formData.birthDate}
              onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
            />
            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Photo de profil</label>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center bg-slate-50">
              <User className="w-10 h-10 text-slate-400" />
            </div>
            <button className="flex items-center gap-2 text-blue-600 bg-blue-50 px-6 py-3 rounded-xl font-medium hover:bg-blue-100 transition-colors">
              <Upload className="w-5 h-5" />
              Télécharger
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-10">
        <button onClick={handleBack} className="flex items-center text-slate-500 hover:text-slate-800 font-medium transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Retour
        </button>
        <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors w-1/2">
          Continuer
        </button>
      </div>
    </div>
  );

  // STEP 3: Address
  const renderStep3 = () => (
    <div className="bg-white p-10 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-xl animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <MapPin className="w-8 h-8 text-blue-600" />
        <h2 className="text-3xl font-bold text-slate-900">Votre adresse</h2>
      </div>
      <p className="text-slate-500 mb-8">Pour un meilleur matching géolocalisé</p>

      <button className="w-full flex items-center justify-center gap-2 text-blue-600 bg-blue-50/50 border border-blue-200 border-dashed px-6 py-4 rounded-xl font-medium hover:bg-blue-50 transition-colors mb-6">
        <MapPin className="w-5 h-5" /> Me géolocaliser automatiquement
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-slate-200"></div>
        <span className="text-slate-400 text-sm">ou remplir manuellement</span>
        <div className="flex-1 h-px bg-slate-200"></div>
      </div>

      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="w-1/3">
            <label className="block text-sm font-medium text-slate-700 mb-2">N°</label>
            <input 
              type="text" placeholder="42"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
              value={formData.streetNumber}
              onChange={(e) => setFormData({...formData, streetNumber: e.target.value})}
            />
          </div>
          <div className="w-2/3">
            <label className="block text-sm font-medium text-slate-700 mb-2">Nom de la rue</label>
            <input 
              type="text" placeholder="Rue de la République"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
              value={formData.streetName}
              onChange={(e) => setFormData({...formData, streetName: e.target.value})}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Code postal</label>
            <input 
              type="text" placeholder="75001"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
              value={formData.zipCode}
              onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Ville</label>
            <input 
              type="text" placeholder="Paris"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Pays</label>
          <select 
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none bg-white"
            value={formData.country}
            onChange={(e) => setFormData({...formData, country: e.target.value})}
          >
            <option>France</option>
            <option>Algérie</option>
            <option>Canada</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between mt-10">
        <button onClick={handleBack} className="flex items-center text-slate-500 hover:text-slate-800 font-medium transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Retour
        </button>
        <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors w-1/2">
          Continuer
        </button>
      </div>
    </div>
  );
  // STEP 4: CV Upload
  const renderStep4 = () => (
    <div className="bg-white p-10 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-xl animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <FileText className="w-8 h-8 text-blue-600" />
        <h2 className="text-3xl font-bold text-slate-900">Votre CV</h2>
      </div>
      <p className="text-slate-500 mb-8">Dernière étape ! Uploadez votre CV pour compléter votre profil.</p>

      {/* Drag & Drop Zone */}
      <div className="border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-blue-50 transition-colors cursor-pointer mb-8">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <Upload className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">Cliquez ou glissez votre CV ici</h3>
        <p className="text-sm text-slate-500">Format PDF, DOC ou DOCX (Max 5MB)</p>
      </div>

      <div className="flex items-center justify-between mt-10">
        <button onClick={handleBack} className="flex items-center text-slate-500 hover:text-slate-800 font-medium transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Retour
        </button>
        {/* Notice this button sets the step to 5 for the success screen */}
        <button onClick={() => setStep(5)} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors w-1/2">
          Terminer l'inscription
        </button>
      </div>
    </div>
  );

  // STEP 5: Success Screen
  const renderSuccess = () => (
    <div className="bg-white p-10 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-md animate-fade-in text-center flex flex-col items-center">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
        <CheckCircle className="w-12 h-12 text-green-500" />
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Inscription réussie !</h2>
      <p className="text-slate-500 mb-8">Votre profil candidat a été créé avec succès. Bienvenue sur MatchTalent !</p>
      
      {/* This button takes them back to the home page for now */}
      <button onClick={() => window.location.href = '/'} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors">
        Accéder à mon espace
      </button>
    </div>
  );
// ==========================================
  //         RECRUITER FLOW FUNCTIONS
  // ==========================================

  // RECRUITER STEP 1: Credentials (Figma: "Créez votre compte")
  const renderRecruiterStep1 = () => (
    <div className="bg-white p-10 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-xl animate-fade-in">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Créez votre compte</h2>
      <p className="text-slate-500 mb-8">Commençons par vos informations de connexion</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Adresse email</label>
          <input 
            type="email" placeholder="exemple@email.com"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} placeholder="Créez un mot de passe sécurisé"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none pr-12"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Numéro de téléphone</label>
          <div className="flex gap-3">
            <select className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none bg-white">
              <option>🇫🇷 +33</option>
            </select>
            <input 
              type="tel" placeholder="6 12 34 56 78"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-10">
        <button onClick={handleBack} className="flex items-center text-slate-500 hover:text-slate-800 font-medium transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Retour
        </button>
        <button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors w-1/2">
          Continuer
        </button>
      </div>
    </div>
  );

  // RECRUITER STEP 2: Company Info (Figma: "Informations entreprise")
  const renderRecruiterStep2 = () => (
    <div className="bg-white p-10 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-xl animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Building className="w-8 h-8 text-indigo-600" />
        <h2 className="text-3xl font-bold text-slate-900">Informations entreprise</h2>
      </div>
      <p className="text-slate-500 mb-8">Présentez votre entreprise</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Nom de l'entreprise</label>
          <input 
            type="text" placeholder="Nom de votre entreprise"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none"
            value={formData.companyName}
            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Secteur d'activité</label>
          <select 
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
            value={formData.industry}
            onChange={(e) => setFormData({...formData, industry: e.target.value})}
          >
            <option value="">Sélectionnez un secteur</option>
            <option>Informatique / Digital</option>
            <option>Finance</option>
            <option>Santé</option>
            <option>Autre</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Logo de l'entreprise</label>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
              <Building className="w-8 h-8 text-slate-400" />
            </div>
            <button className="flex items-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-6 py-3 rounded-xl font-medium transition-colors">
              <Upload className="w-5 h-5" /> Télécharger
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-10">
        <button onClick={handleBack} className="flex items-center text-slate-500 hover:text-slate-800 font-medium transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Retour
        </button>
        <button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors w-1/2">
          Continuer
        </button>
      </div>
    </div>
  );

  // RECRUITER STEP 4: Documents (Figma: "Documents entreprise")
  const renderRecruiterStep4 = () => (
    <div className="bg-white p-10 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-xl animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Sparkles className="w-8 h-8 text-indigo-600" />
        <h2 className="text-3xl font-bold text-slate-900">Documents entreprise</h2>
      </div>
      <p className="text-indigo-600 font-medium mb-8">Vérification de votre entreprise par notre IA</p>

      <label className="block text-sm font-medium text-slate-700 mb-2">Documents d'authentification de l'entreprise</label>
      
      {/* Drag & Drop Zone */}
      <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-indigo-50 transition-colors cursor-pointer mb-8">
        <div className="mb-4">
          <Building className="w-12 h-12 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">Glissez-déposez vos documents ici</h3>
        <p className="text-sm text-slate-500">KBIS, certificat d'immatriculation, etc.</p>
      </div>

      <div className="flex items-center justify-between mt-10">
        <button onClick={handleBack} className="flex items-center text-slate-500 hover:text-slate-800 font-medium transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Retour
        </button>
        {/* Matches the browser alert from your final Figma image */}
        <button onClick={() => {
            alert("Inscription terminée avec succès ! 🎉");
            window.location.href = '/'; 
        }} className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors w-1/2">
          <Sparkles className="w-5 h-5" /> Terminer l'inscription
        </button>
      </div>
    </div>
  );

  return (
<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8">
      
{/* Only show the top logo if we are past Step 0 */}
      {step > 0 && (
        <div className="mb-8 cursor-pointer" onClick={() => window.location.href = '/'}>
          <h1 className="text-2xl font-bold text-blue-600">MatchTalent.</h1>
        </div>
      )}

{/* Form Steps Rendering */}
      {step === 0 && renderRoleSelection()}
      
      {/* Candidate Flow */}
      {role === 'candidate' && (
        <>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderSuccess()}
        </>
      )}

      {/* Recruiter Flow */}
      {role === 'recruiter' && (
        <>
          {step === 1 && renderRecruiterStep1()}
          {step === 2 && renderRecruiterStep2()}
          {step === 3 && renderStep3()} {/* Address is Step 3 */}
          {step === 4 && renderRecruiterStep4()} {/* New Documents Step */}
        </>
      )}


    </div>
  );
}