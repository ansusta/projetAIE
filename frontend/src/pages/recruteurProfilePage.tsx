import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Building2, Wrench } from 'lucide-react';

export default function RecruteurProfilePage() {
  const navigate = useNavigate();
  const { id }   = useParams();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto">
          <Building2 className="w-10 h-10 text-indigo-400" />
        </div>
        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Wrench className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">En construction</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Profil Recruteur</h2>
          <p className="text-slate-500 mt-2 leading-relaxed">
            La page de profil public des recruteurs est en cours de développement et sera bientôt disponible.
          </p>
          <p className="text-xs text-slate-400 mt-3 font-mono bg-slate-50 px-3 py-1.5 rounded-lg inline-block">
            Recruteur ID : {id}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mx-auto transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Retour
        </button>
      </div>
    </div>
  );
}