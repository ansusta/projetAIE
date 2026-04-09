import React from 'react';
import { Sparkles, Target, Zap, Shield, Users, Building2, Check, TrendingUp, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  return (
    // The soft background applied to the whole page, exactly like Figma
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      
{/* NAVBAR - Re-centered Layout */}
      <header className="grid grid-cols-3 items-center px-8 py-6 max-w-7xl mx-auto w-full">
        
        {/* Left: Logo */}
        <div className="flex justify-start">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-200">
              <Target className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-black tracking-tight text-slate-900">
                Match<span className="text-blue-600">Talent</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                AI Powered
              </span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex justify-center gap-12 text-sm font-semibold text-slate-600">
          <a href="#" className="hover:text-blue-600 transition-colors">Fonctionnalités</a>
          <a href="#" className="hover:text-blue-600 transition-colors">À propos</a>
        </nav>

        {/* Right: Button */}
        <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/30 transition-all cursor-pointer">
  Connexion
</button>
        </div>

      </header>
      {/* 1. HERO SECTION */}
      <section className="pt-20 pb-24 px-6 text-center max-w-5xl mx-auto">
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700 mb-8 shadow-sm">
  <Sparkles className="w-4 h-4 text-blue-600" />
  Propulsé par l'Intelligence Artificielle
</div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          Trouvez votre <span className="text-blue-600">match<br/>parfait</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-3xl mx-auto leading-relaxed">
          La plateforme de recrutement intelligente qui connecte les meilleurs talents 
          avec les entreprises qui leur correspondent vraiment.
        </p>

        <div className="flex flex-col items-center justify-center gap-4">
          <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:from-blue-700 hover:to-indigo-700 hover:scale-105 transition-all shadow-xl shadow-indigo-200 flex items-center gap-2 cursor-pointer">
            Commencer gratuitement <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-slate-500">
            Aucune carte de crédit requise • Inscription en 2 minutes
          </p>
        </div>
      </section>

      {/* 2. STATS */}
      <section className="py-12 border-y border-slate-200/60 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-extrabold text-blue-600 mb-2">10K+</div>
            <div className="text-sm font-medium text-slate-500">Candidats actifs</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-blue-600 mb-2">2K+</div>
            <div className="text-sm font-medium text-slate-500">Entreprises</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-blue-600 mb-2">95%</div>
            <div className="text-sm font-medium text-slate-500">Taux de matching</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-blue-600 mb-2">24h</div>
            <div className="text-sm font-medium text-slate-500">Temps moyen de réponse</div>
          </div>
        </div>
      </section>

      {/* 3. FEATURES GRID ("Pourquoi choisir MatchTalent ?") */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Pourquoi choisir MatchTalent ?</h2>
          <p className="text-slate-500 text-lg">Des fonctionnalités innovantes pour un recrutement moderne</p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">IA Intelligente</h3>
            <p className="text-slate-500 leading-relaxed">Notre intelligence artificielle analyse les profils et crée des matchs parfaits</p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Matching Géolocalisé</h3>
            <p className="text-slate-500 leading-relaxed">Trouvez des opportunités près de chez vous grâce à notre système de géolocalisation</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Processus Rapide</h3>
            <p className="text-slate-500 leading-relaxed">Inscription en 4 étapes simples et rapides pour commencer immédiatement</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">100% Sécurisé</h3>
            <p className="text-slate-500 leading-relaxed">Vos données sont protégées et vérifiées par notre système de validation IA</p>
          </div>
        </div>
      </section>

      {/* 4. ROLES ("Une solution pour chacun") */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Une solution pour chacun</h2>
          <p className="text-slate-500 text-lg">Que vous cherchiez un emploi ou recrutiez des talents</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Candidats */}
          <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold">Pour les candidats</h3>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-slate-600"><Check className="w-5 h-5 text-blue-600 flex-shrink-0" /> Profil optimisé par IA à partir de votre CV</li>
              <li className="flex items-center gap-3 text-slate-600"><Check className="w-5 h-5 text-blue-600 flex-shrink-0" /> Recommandations personnalisées d'emplois</li>
              <li className="flex items-center gap-3 text-slate-600"><Check className="w-5 h-5 text-blue-600 flex-shrink-0" /> Alertes en temps réel pour les nouvelles opportunités</li>
              <li className="flex items-center gap-3 text-slate-600"><Check className="w-5 h-5 text-blue-600 flex-shrink-0" /> Suivi de vos candidatures en un coup d'œil</li>
            </ul>
            <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors cursor-pointer">
              Je cherche un emploi
            </button>
          </div>

          {/* Recruteurs */}
          <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold">Pour les recruteurs</h3>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-slate-600"><Check className="w-5 h-5 text-indigo-600 flex-shrink-0" /> Validation automatique des entreprises</li>
              <li className="flex items-center gap-3 text-slate-600"><Check className="w-5 h-5 text-indigo-600 flex-shrink-0" /> Accès à une base de talents qualifiés</li>
              <li className="flex items-center gap-3 text-slate-600"><Check className="w-5 h-5 text-indigo-600 flex-shrink-0" /> Matching intelligent basé sur vos critères</li>
              <li className="flex items-center gap-3 text-slate-600"><Check className="w-5 h-5 text-indigo-600 flex-shrink-0" /> Gestion simplifiée de vos offres d'emploi</li>
            </ul>
            <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors cursor-pointer">
              Je recrute des talents
            </button>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS - Unified Brand Gradients */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-slate-900">Comment ça marche ?</h2>
          <p className="text-slate-500 text-lg">Un processus simple en 4 étapes</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-blue-200">
              1
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-800">Choisissez votre rôle</h3>
            <p className="text-slate-500 text-sm">Candidat ou Recruteur</p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-blue-200">
              2
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-800">Créez votre profil</h3>
            <p className="text-slate-500 text-sm">En quelques clics</p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-blue-200">
              3
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-800">L'IA fait le travail</h3>
            <p className="text-slate-500 text-sm">Analyse et matching intelligent</p>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-blue-200">
              4
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-800">Trouvez votre match</h3>
            <p className="text-slate-500 text-sm">Connectez-vous avec succès</p>
          </div>
        </div>
      </section>

      {/* 6. BOTTOM CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-600 to-indigo-700 w-full text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <TrendingUp className="w-16 h-16 text-white mb-8" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Prêt à transformer votre recherche ?
          </h2>
          <p className="text-blue-100 text-lg md:text-xl mb-10">
            Rejoignez des milliers de professionnels qui ont déjà trouvé leur match parfait
          </p>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer shadow-xl">
            Commencer maintenant <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

{/* 8. ENHANCED MULTI-COLUMN FOOTER */}
      <footer className="bg-[#0B1120] pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            
            {/* Brand Column */}
            <div className="col-span-1 md:col-span-1">
              <div className="text-2xl font-bold text-white tracking-tight mb-4">
                Match<span className="text-blue-500">Talent</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                L'intelligence artificielle au service de votre carrière et de vos recrutements. 
                Trouvez l'opportunité qui vous correspond vraiment.
              </p>
              {/* Social Icons Placeholder */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
                  <span className="text-xs font-bold">In</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-400 hover:text-white transition-all cursor-pointer">
                  <span className="text-xs font-bold">X</span>
                </div>
              </div>
            </div>

            {/* Links Column 1 */}
            <div>
              <h4 className="text-white font-bold mb-6">Plateforme</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Comment ça marche</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Pour les candidats</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Pour les recruteurs</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Tarifs</a></li>
              </ul>
            </div>

            {/* Links Column 2 */}
            <div>
              <h4 className="text-white font-bold mb-6">Entreprise</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Carrières</a></li>
              </ul>
            </div>

            {/* Newsletter/Legal Column */}
            <div>
              <h4 className="text-white font-bold mb-6">Légal</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Confidentialité</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Conditions d'utilisation</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Mentions légales</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-xs">
              © 2026 MatchTalent. Fait avec passion pour le futur du travail.
            </p>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-slate-500 text-xs font-medium">Système IA Opérationnel</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;