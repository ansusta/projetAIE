import React from 'react';
import { Sparkles, Target, Zap, Shield, Users, Building2, CheckCircle } from 'lucide-react';
import Logo from '../components/Logo';
import { Link } from 'react-router-dom';

export default function FeaturesPage() {
  const features = [
    { icon: Sparkles, title: "Recherche Optimisée par IA", desc: "Notre moteur analyse votre profil et vous suggère les meilleures correspondances." },
    { icon: Target, title: "Filtres Géolocalisés", desc: "Trouvez des offres près de chez vous ou en télétravail." },
    { icon: Zap, title: "Processus Rapide", desc: "Inscription en 2 minutes, recommandations immédiates." },
    { icon: Shield, title: "100% Sécurisé", desc: "Données protégées, vérification des entreprises." }
  ];
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Link to="/"><Logo /></Link>
        <div className="flex gap-4">
          <Link to="/login" className="text-slate-600 hover:text-blue-600 font-medium">Connexion</Link>
          <Link to="/register" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-xl font-medium">S'inscrire</Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-6">Fonctionnalités <span className="text-blue-600">MatchTalent</span></h1>
        <p className="text-center text-slate-500 text-lg mb-16">Tout ce dont vous avez besoin pour recruter ou trouver un emploi.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4"><f.icon className="text-blue-600 w-6 h-6" /></div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}