import React, { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
// Assurez-vous que le chemin d'importation vers Filtrespersonnelsform est correct
import FiltresPersonnelsForm from '../pages/Filtrespersonnelsform'; 

export default function EditJobModal({ isOpen, onClose, onSave, offre }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    titre: '', typeContrat: 'CDI', localisation: '',
    salaireMin: '', salaireMax: '', description: '', requis: '', statutOffre: 'ouvert'
  });
  const [filtresPersonnels, setFiltresPersonnels] = useState({ ageMin: null, ageMax: null, genres: [] });

  useEffect(() => {
    if (offre && isOpen) {
      setFormData({
        titre: offre.titre || '',
        typeContrat: offre.typeContrat || 'CDI',
        localisation: offre.localisation || '',
        salaireMin: offre.salaireMin || '',
        salaireMax: offre.salaireMax || '',
        description: offre.description || '',
        requis: offre.requis ? offre.requis.join(', ') : '',
        statutOffre: offre.statutOffre || 'ouvert'
      });
      setFiltresPersonnels(offre.filtresPersonnels || { ageMin: null, ageMax: null, genres: [] });
    }
  }, [offre, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim()) return setError('Le titre est requis.');
    
    setIsLoading(true);
    setError('');
    
    try {
      const payload = {
        titre: formData.titre,
        typeContrat: formData.typeContrat,
        localisation: formData.localisation,
        description: formData.description,
        requis: formData.requis ? formData.requis.split(',').map(s => s.trim()).filter(Boolean) : [],
        salaireMin: formData.salaireMin ? Number(formData.salaireMin) : undefined,
        salaireMax: formData.salaireMax ? Number(formData.salaireMax) : undefined,
        statutOffre: formData.statutOffre,
        filtresPersonnels,
      };
      
      // On appelle la fonction du parent pour sauvegarder
      await onSave(offre._id, payload);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inp = "w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Modifier l'offre</h2>
            <p className="text-sm text-slate-500 mt-1">Mettez à jour les détails ou modifiez le statut.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}
          <form id="edit-job-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex items-center gap-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-6">
               <label className="block text-sm font-bold text-indigo-900 whitespace-nowrap">Statut :</label>
               <select className={`${inp} py-2 bg-white`} value={formData.statutOffre} onChange={e => setFormData({ ...formData, statutOffre: e.target.value })}>
                  <option value="ouvert">Ouvert (Actif)</option>
                  <option value="fermer">Fermée (Complétée)</option>
               </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Titre du poste *</label>
              <input type="text" required placeholder="Ex: Développeur Front-End" className={inp} value={formData.titre} onChange={e => setFormData({ ...formData, titre: e.target.value })} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Contrat</label>
                <select className={`${inp} cursor-pointer`} value={formData.typeContrat} onChange={e => setFormData({ ...formData, typeContrat: e.target.value })}>
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="freelance">Freelance</option>
                  <option value="stage">Stage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lieu</label>
                <input type="text" placeholder="Ex: Alger (Hybride)" className={inp} value={formData.localisation} onChange={e => setFormData({ ...formData, localisation: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Salaire min</label>
                <input type="number" className={inp} value={formData.salaireMin} onChange={e => setFormData({ ...formData, salaireMin: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea rows="4" className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 bg-slate-50 focus:bg-white resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prérequis (séparés par des virgules)</label>
              <textarea rows="2" className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 bg-slate-50 focus:bg-white resize-none" value={formData.requis} onChange={e => setFormData({ ...formData, requis: e.target.value })} />
            </div>
            
            <FiltresPersonnelsForm value={filtresPersonnels} onChange={setFiltresPersonnels} />
          </form>
        </div>

        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">
            Annuler
          </button>
          <button type="submit" form="edit-job-form" disabled={isLoading} className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all ${ isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700' }`}>
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Enregistrement…</> : <><Save className="w-5 h-5" /> Enregistrer</>}
          </button>
        </div>
      </div>
    </div>
  );
}