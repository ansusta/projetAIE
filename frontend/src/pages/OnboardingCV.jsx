import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Plus,
  Trash2
} from 'lucide-react';

export default function OnboardingCV() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // État initial du CV structuré
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    bio: '',
    experiences: [{ id: Date.now(), role: '', company: '', duration: '', description: '' }],
    education: [{ id: Date.now(), degree: '', school: '', year: '' }],
    skills: ''
  });

  // --- Validation ---
  // Vérifie que le prénom et le nom ne sont pas vides
  const isStep1Valid = formData.firstName.trim() !== '' && formData.lastName.trim() !== '';
  
  // Détermine si on a le droit de passer à l'étape suivante
  const canGoNext = step === 1 ? isStep1Valid : true;

  const nextStep = () => {
    if (canGoNext) setStep(step + 1);
  };
  const prevStep = () => setStep(step - 1);

  // --- Gestion des Expériences & Formations ---
  const addEntry = (type) => {
    const newEntry = type === 'experiences' 
      ? { id: Date.now(), role: '', company: '', duration: '', description: '' }
      : { id: Date.now(), degree: '', school: '', year: '' };
    setFormData({ ...formData, [type]: [...formData[type], newEntry] });
  };

  const removeEntry = (type, id) => {
    setFormData({ ...formData, [type]: formData[type].filter(item => item.id !== id) });
  };

  const updateEntry = (type, id, field, value) => {
    const updated = formData[type].map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setFormData({ ...formData, [type]: updated });
  };

  // --- Finalisation de l'onboarding ---
  const handleComplete = () => {
    console.log("Données prêtes à être envoyées à la base de données :", formData);
    // Redirection automatique vers le Dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden">
        
        {/* Barre de progression (Stepper) corrigée */}
        <div className="bg-slate-900 p-8 pb-12 text-white">
          <div className="flex justify-between items-center relative">
            {/* Ligne de connexion au centre */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-700 -translate-y-1/2 z-0"></div>
            
            {[
              { num: 1, label: 'INFOS' },
              { num: 2, label: 'EXPÉRIENCES' },
              { num: 3, label: 'FORMATION' },
              { num: 4, label: 'COMPÉTENCES' }
            ].map((item) => (
              <div key={item.num} className="relative z-10 flex flex-col items-center">
                {/* Cercle */}
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                    step >= item.num ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {step > item.num ? <Check className="w-5 h-5" /> : item.num}
                </div>
                
                {/* Texte positionné en absolu pour être parfaitement centré sous le cercle */}
                <span className={`absolute top-14 text-[11px] font-bold tracking-wider whitespace-nowrap transition-colors ${
                  step >= item.num ? 'text-blue-100' : 'text-slate-500'
                }`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-8 md:p-12">
          
          {/* ÉTAPE 1 : Infos Personnelles */}
          {step === 1 && (
            <div className="animate-fade-in space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Commençons par le début</h2>
                <p className="text-slate-500">Présentez-vous en quelques mots pour l'IA.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Prénom <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all" placeholder="ex: Sarah" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nom <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all" placeholder="ex: Lambert" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Titre de votre profil</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all" placeholder="ex: Développeuse Fullstack React" />
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : Expériences */}
          {step === 2 && (
            <div className="animate-fade-in space-y-6">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Votre parcours</h2>
                  <p className="text-slate-500">Ajoutez vos expériences professionnelles.</p>
                </div>
                <button onClick={() => addEntry('experiences')} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                  <Plus className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-8">
                {formData.experiences.map((exp) => (
                  <div key={exp.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50 relative group">
                    <button onClick={() => removeEntry('experiences', exp.id)} className="absolute -top-2 -right-2 bg-white text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <input type="text" placeholder="Poste" value={exp.role} onChange={(e) => updateEntry('experiences', exp.id, 'role', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
                      <input type="text" placeholder="Entreprise" value={exp.company} onChange={(e) => updateEntry('experiences', exp.id, 'company', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
                    </div>
                    <input type="text" placeholder="Période (ex: 2021 - 2023)" value={exp.duration} onChange={(e) => updateEntry('experiences', exp.id, 'duration', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-blue-600 outline-none" />
                    <textarea placeholder="Description de vos missions..." value={exp.description} onChange={(e) => updateEntry('experiences', exp.id, 'description', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" rows="2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : Formation */}
          {step === 3 && (
             <div className="animate-fade-in space-y-6">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Éducation</h2>
                    <p className="text-slate-500">Quels sont vos diplômes ?</p>
                  </div>
                  <button onClick={() => addEntry('education')} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
                {formData.education.map((edu) => (
                  <div key={edu.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50 space-y-4 relative group">
                     <button onClick={() => removeEntry('education', edu.id)} className="absolute -top-2 -right-2 bg-white text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <input type="text" placeholder="Diplôme" value={edu.degree} onChange={(e) => updateEntry('education', edu.id, 'degree', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
                    <div className="grid grid-cols-3 gap-4">
                      <input type="text" placeholder="École" value={edu.school} onChange={(e) => updateEntry('education', edu.id, 'school', e.target.value)} className="col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
                      <input type="text" placeholder="Année" value={edu.year} onChange={(e) => updateEntry('education', edu.id, 'year', e.target.value)} className="col-span-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
                    </div>
                  </div>
                ))}
             </div>
          )}

          {/* ÉTAPE 4 : Compétences & Finalisation */}
          {step === 4 && (
            <div className="animate-fade-in space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Le mot de la fin</h2>
                <p className="text-slate-500">Ajoutez vos compétences et votre bio.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Compétences (séparées par des virgules)</label>
                <input type="text" value={formData.skills} onChange={(e) => setFormData({...formData, skills: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all" placeholder="ex: React, Node.js, Design Thinking" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Bio / Résumé</label>
                <textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows="4" className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all" placeholder="Parlez-nous de vos motivations..." />
              </div>
            </div>
          )}

          {/* Boutons de navigation */}
          <div className="mt-12 flex justify-between gap-4">
            {step > 1 ? (
              <button onClick={prevStep} className="flex items-center gap-2 px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all">
                <ArrowLeft className="w-5 h-5" /> Retour
              </button>
            ) : <div />}

            <button 
              onClick={step === 4 ? handleComplete : nextStep}
              disabled={!canGoNext}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
                canGoNext 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {step === 4 ? "Terminer l'inscription" : "Continuer"} 
              {step !== 4 && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}