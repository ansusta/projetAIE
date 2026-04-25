import React, { useState } from 'react';
import { X, Mail, Phone, Download, Calendar, Briefcase, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function CandidateProfileModal({ isOpen, onClose, candidate }) {
  // État local pour simuler le changement de statut
  const [currentStatus, setCurrentStatus] = useState(candidate?.status || 'Nouveau');

  if (!isOpen || !candidate) return null;

  const getStatusColor = (status) => {
    switch(status) {
      case 'Nouveau': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'En entretien': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'En attente': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Refusé': return 'bg-red-50 text-red-600 border-red-200';
      case 'Accepté': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        
        {/* En-tête : Info rapide & Avatar */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between bg-white z-10 relative overflow-hidden">
          {/* Motif de fond stylisé */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-50"></div>
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-3xl font-black shadow-inner">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{candidate.name}</h2>
              <p className="text-indigo-600 font-semibold text-lg">{candidate.role}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {candidate.exp} d'expérience</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Postulé {candidate.date}</span>
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative z-10">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Colonne de gauche : Infos & Compétences */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">À propos</h3>
                <p className="text-slate-600 leading-relaxed">
                  {candidate.bio || "Ce candidat n'a pas encore ajouté de description détaillée, mais son profil correspond aux critères de base pour cette offre."}
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Compétences clés</h3>
                <div className="flex flex-wrap gap-2">
                  {(candidate.skills || ['React', 'JavaScript', 'CSS', 'Travail en équipe']).map((skill, index) => (
                    <span key={index} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Colonne de droite : Actions & Contact */}
            <div className="space-y-6">
              
              {/* Statut de la candidature */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Statut actuel</h3>
                <select 
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 font-bold outline-none cursor-pointer transition-colors ${getStatusColor(currentStatus)}`}
                >
                  <option value="Nouveau">🔵 Nouveau</option>
                  <option value="En entretien">🟣 En entretien</option>
                  <option value="En attente">🟠 En attente</option>
                  <option value="Accepté">🟢 Accepté</option>
                  <option value="Refusé">🔴 Refusé</option>
                </select>
              </div>

              {/* Coordonnées */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Contact</h3>
                <a href={`mailto:${candidate.email || 'candidat@email.com'}`} className="flex items-center gap-3 text-slate-600 hover:text-indigo-600 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center"><Mail className="w-5 h-5" /></div>
                  <span className="text-sm font-medium">{candidate.email || 'candidat@email.com'}</span>
                </a>
                <a href={`tel:${candidate.phone || '+213 600 000 000'}`} className="flex items-center gap-3 text-slate-600 hover:text-indigo-600 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center"><Phone className="w-5 h-5" /></div>
                  <span className="text-sm font-medium">{candidate.phone || '+213 6 00 00 00 00'}</span>
                </a>
              </div>

              {/* Actions Rapides */}
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all">
                  <Calendar className="w-5 h-5" /> Planifier un entretien
                </button>
                <button className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl font-bold transition-all">
                  <Download className="w-5 h-5" /> Télécharger le CV
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}