import React, { useState } from 'react';
import { X, Briefcase, MapPin, FileText, CheckCircle, Loader2, DollarSign, ListChecks } from 'lucide-react';

export default function CreateJobModal({ isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'CDI',
    location: '',
    salary: '',
    description: '',
    requirements: ''
  });

  // Si la modale n'est pas ouverte, on ne rend rien
  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Connecter à votre API backend (ex: jobService.createJob(formData))
      console.log("Données de la nouvelle offre :", formData);
      
      // Simulation d'un appel API de 1.5 seconde
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      // Fermer la modale après le succès
      onClose();
    } catch (error) {
      console.error("Erreur lors de la création de l'offre", error);
    } finally {
      setIsLoading(false);
    }
  };

  const inp = "w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      
      {/* Conteneur de la modale */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        
        {/* En-tête fixe */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Créer une nouvelle offre</h2>
            <p className="text-sm text-slate-500 mt-1">Remplissez les détails pour publier votre annonce.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Corps du formulaire (défilable) */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <form id="create-job-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Titre du poste */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Titre du poste</label>
              <div className="relative">
                <Briefcase className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  name="title"
                  required
                  placeholder="Ex: Développeur Front-End React" 
                  className={inp}
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Type de contrat */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type de contrat</label>
                <div className="relative">
                  <FileText className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                  <select 
                    name="type"
                    className={`${inp} appearance-none cursor-pointer`}
                    value={formData.type}
                    onChange={handleChange}
                  >
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Stage">Stage</option>
                    <option value="Alternance">Alternance</option>
                  </select>
                </div>
              </div>

              {/* Lieu */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lieu</label>
                <div className="relative">
                  <MapPin className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    name="location"
                    required
                    placeholder="Ex: Alger (Hybride)" 
                    className={inp}
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Salaire */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Salaire (Optionnel)</label>
                <div className="relative">
                  <DollarSign className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    name="salary"
                    placeholder="Ex: 150k - 200k DZD" 
                    className={inp}
                    value={formData.salary}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description du poste</label>
              <textarea 
                name="description"
                required
                rows="4" 
                placeholder="Décrivez les missions principales, l'équipe, etc." 
                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors resize-none"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* Prérequis */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prérequis & Compétences</label>
              <textarea 
                name="requirements"
                required
                rows="3" 
                placeholder="Ex: 3 ans d'expérience, maîtrise de React, bon niveau d'anglais..." 
                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors resize-none"
                value={formData.requirements}
                onChange={handleChange}
              />
            </div>

          </form>
        </div>

        {/* Pied de page avec les boutons d'action */}
        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Annuler
          </button>
          <button 
            type="submit"
            form="create-job-form"
            disabled={isLoading}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
              isLoading ? 'bg-indigo-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Publication...</> : <><CheckCircle className="w-5 h-5" /> Publier l'offre</>}
          </button>
        </div>

      </div>
    </div>
  );
}