import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const APropos: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo />
          <Link to="/" className="text-sm font-medium text-blue-600 hover:underline">
            Retour à l'accueil
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-extrabold mb-6">À propos de MatchTalent</h1>
        <p className="text-slate-600 text-lg leading-relaxed mb-4">
          MatchTalent est la plateforme qui révolutionne le recrutement en Algérie...
        </p>
        <p className="text-slate-600 text-lg leading-relaxed">
          Notre mission : rendre le processus de recrutement plus humain...
        </p>
      </main>
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-sm">
        © 2026 MatchTalent
      </footer>
    </div>
  );
};

export default APropos;