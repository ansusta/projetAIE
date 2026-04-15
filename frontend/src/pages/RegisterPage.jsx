import React, { useState } from 'react';
import { User, Briefcase, Eye, EyeOff, ChevronLeft, Upload, MapPin, Calendar, FileText, CheckCircle, Building, Globe, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react'; 

export default function RegisterPage() {
  const location = useLocation();
  const initialRole = location.state?.role || null;

  const [step, setStep] = useState(initialRole ? 1 : 0);
  const [role, setRole] = useState(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
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
    companyName: '',
    industry: '',
    companySize: '',
    website: '',
  });

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);
  const navigate = useNavigate();

  // --- FONCTION DE SOUMISSION PROFESSIONNELLE ---
  const handleRegister = async (e) => {
    if (e) e.preventDefault(); 
    setIsLoading(true);
    
    // Simulation d'appel API de création de compte
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    
    // Redirection Intelligente
    if (role === 'candidate') {
      navigate('/onboarding'); // Le candidat va vers le multi-step form pro
    } else {
      navigate('/dashboard'); // Le recruteur va à son espace
    }
  };

  // --- ÉTAPE 0 : CHOIX DU RÔLE ---
  const renderRoleSelection = () => (
    <div className="flex flex-col items-center animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-blue-600 tracking-tight mb-2">MatchTalent</h1>
        <p className="text-slate-500 font-medium">Votre plateforme de recrutement intelligente</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
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
    </div>
  );

  // --- PARCOURS CANDIDAT : ÉTAPE UNIQUE (Identifiants) ---
  const renderCandidateStep1 = () => (
    <div className="bg-white p-10 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-xl animate-fade-in">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Créez votre compte</h2>
      <p className="text-slate-500 mb-8">Commençons par vos informations de connexion</p>

      <div className="space-y-6">
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
      </div>

      <div className="flex items-center justify-between mt-10">
        <button onClick={handleBack} className="flex items-center text-slate-500 hover:text-slate-800 font-medium transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Retour
        </button>
        <button 
          onClick={handleRegister} 
          disabled={isLoading}
          className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all w-1/2 ${
            isLoading ? 'bg-blue-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Création...</>
          ) : (
            "Créer mon compte"
          )}
        </button>
      </div>
    </div>
  );

  // --- PARCOURS RECRUTEUR ---
  const renderRecruiterStep1 = () => (
    <div className="bg-white p-10 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-xl animate-fade-in">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Compte Recruteur</h2>
      <p className="text-slate-500 mb-8">Commençons par vos informations de connexion</p>
      {/* Mêmes champs email/mot de passe que candidat */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Adresse email</label>
          <input type="email" placeholder="rh@entreprise.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none pr-12" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
          <input type="text" placeholder="Nom de votre entreprise" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Secteur d'activité</label>
          <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none bg-white" value={formData.industry} onChange={(e) => setFormData({...formData, industry: e.target.value})}>
            <option value="">Sélectionnez un secteur</option>
            <option>Informatique / Digital</option>
            <option>Finance</option>
            <option>Santé</option>
            <option>Autre</option>
          </select>
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

  const renderRecruiterStep3 = () => (
    <div className="bg-white p-10 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-xl animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Sparkles className="w-8 h-8 text-indigo-600" />
        <h2 className="text-3xl font-bold text-slate-900">Documents entreprise</h2>
      </div>
      <p className="text-indigo-600 font-medium mb-8">Dernière étape pour vérifier votre compte</p>
      
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
        
        <button 
          onClick={handleRegister} 
          disabled={isLoading}
          className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all w-1/2 ${
            isLoading ? 'bg-indigo-400 cursor-not-allowed text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {isLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Vérification...</>
          ) : (
            <><CheckCircle className="w-5 h-5" /> Terminer</>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8">
      {step > 0 && (
        <div className="mb-8 cursor-pointer" onClick={() => navigate('/')}>
          <h1 className="text-2xl font-bold text-blue-600">MatchTalent.</h1>
        </div>
      )}

      {step === 0 && renderRoleSelection()}
      
      {/* Flux Candidat Ultra Rapide (1 seule étape -> Onboarding) */}
      {role === 'candidate' && step === 1 && renderCandidateStep1()}

      {/* Flux Recruteur (3 étapes -> Dashboard) */}
      {role === 'recruiter' && (
        <>
          {step === 1 && renderRecruiterStep1()}
          {step === 2 && renderRecruiterStep2()}
          {step === 3 && renderRecruiterStep3()} 
        </>
      )}
    </div>
  );
}