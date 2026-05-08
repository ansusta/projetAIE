import React from 'react';
import Logo from '../components/Logo';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Link to="/"><Logo /></Link>
        <div className="flex gap-4">
          <Link to="/login" className="text-slate-600 hover:text-blue-600 font-medium">Connexion</Link>
          <Link to="/register" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-xl font-medium">S'inscrire</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-extrabold mb-6">À propos de <span className="text-blue-600">MatchTalent</span></h1>
        <div className="bg-white p-8 rounded-3xl shadow-sm text-left space-y-6 text-slate-600">
          <p><strong className="text-slate-900">MatchTalent</strong> est une plateforme de recrutement nouvelle génération qui utilise l'intelligence artificielle pour connecter les talents avec les entreprises qui leur correspondent vraiment.</p>
          <p>Notre mission : <strong>supprimer les biais et les incohérences</strong> dans le recrutement, grâce à un matching précis basé sur les compétences, les valeurs et la localisation.</p>
          <p>Créée en 2025 par une équipe de passionnés de technologie et de RH, MatchTalent accompagne aujourd'hui plus de 10 000 candidats et 2 000 entreprises en Algérie.</p>
          <div className="pt-4 text-blue-600 font-semibold">✉️ contact@matchtalent.dz</div>
        </div>
      </main>
    </div>
  );
}