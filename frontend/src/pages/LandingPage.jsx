import React from 'react';
import { Sparkles, Target, Zap, Shield, Users, Building2, Check, TrendingUp, ArrowRight, MapPin, Briefcase } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';

const LandingPage = () => {
  const navigate = useNavigate();
  
  // Données avec le nouveau format (logos générés et sans bouton)
  const topPartners = [
    {
      id: 1,
      name: "TECHFLOW DIGITAL",
      industry: "Développement Web",
      location: "19000 - SÉTIF",
      openPositions: 3,
      logo: "https://api.dicebear.com/7.x/shapes/svg?seed=TechFlow&backgroundColor=e2e8f0"
    },
    {
      id: 2,
      name: "AURA DATA INTELLIGENCE",
      industry: "Intelligence Artificielle",
      location: "16000 - ALGER",
      openPositions: 1,
      logo: "https://api.dicebear.com/7.x/shapes/svg?seed=AuraData&backgroundColor=e0e7ff"
    },
    {
      id: 3,
      name: "DESIGNSTUDIO",
      industry: "Design & UX",
      location: "31000 - ORAN",
      openPositions: 2,
      logo: "https://api.dicebear.com/7.x/shapes/svg?seed=DesignStudio&backgroundColor=d1fae5"
    },
    {
      id: 4,
      name: "SECURENET CYBERSECURITÉ",
      industry: "Cybersécurité",
      location: "19000 - SÉTIF",
      openPositions: 1,
      logo: "https://api.dicebear.com/7.x/shapes/svg?seed=SecureNet&backgroundColor=ffedd5"
    },
    {
      id: 5,
      name: "GREEN TECH SOLUTIONS DZ",
      industry: "Énergie / Environnement",
      location: "25000 - CONSTANTINE",
      openPositions: 4,
      logo: "https://api.dicebear.com/7.x/shapes/svg?seed=GreenTech&backgroundColor=dcfce7"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      
      {/* NAVBAR */}
      <header className="grid grid-cols-3 items-center px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex justify-start">
          <Logo />
        </div>

        <nav className="hidden md:flex justify-center gap-12 text-sm font-semibold text-slate-600">
          <Link to="/features" className="hover:text-blue-600 transition-colors">Fonctionnalités</Link>
          <Link to="/about" className="hover:text-blue-600 transition-colors">À propos</Link>
        </nav>

        <div className="flex justify-end items-center gap-2 sm:gap-4">
          <button 
            onClick={() => navigate('/login')} 
            className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            Connexion
          </button>
          
          <button 
            onClick={() => navigate('/register')} 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-md shadow-blue-600/20 hover:shadow-blue-600/40"
          >
            S'inscrire
          </button>
        </div>        
      </header>

      {/* 1. HERO SECTION */}
      <section className="pt-20 pb-24 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700 mb-8 shadow-sm">
          <Sparkles className="w-4 h-4 text-blue-600" />
          La plateforme de recrutement nouvelle génération
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          Trouvez votre <span className="text-blue-600">match<br/>parfait</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-3xl mx-auto leading-relaxed">
          La plateforme de recrutement qui connecte les meilleurs talents 
          avec les entreprises qui leur correspondent vraiment.
        </p>

        <div className="flex flex-col items-center justify-center gap-4">
          <button onClick={() => navigate('/register')} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:from-blue-700 hover:to-indigo-700 hover:scale-105 transition-all shadow-xl shadow-indigo-200 flex items-center gap-2 cursor-pointer">
            Commencer maintenant <ArrowRight className="w-5 h-5" />
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
            <div className="text-sm font-medium text-slate-500">Taux de satisfaction</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-blue-600 mb-2">24h</div>
            <div className="text-sm font-medium text-slate-500">Temps moyen de réponse</div>
          </div>
        </div>
      </section>

      {/* SECTION : ENTREPRISES PARTENAIRES (Design Exact France Travail) */}
      <section id="entreprises" className="py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              Les employeurs à la une
            </h2>
          </div>

          {/* Grille sur 5 colonnes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {topPartners.map((partner) => (
              <div 
                key={partner.id} 
                onClick={() => navigate('/register')}
                className="bg-white border border-slate-200 rounded-[1.5rem] p-5 flex flex-col hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer"
              >
                {/* Espace Logo Agrandit */}
                <div className="h-16 mb-4 flex items-center justify-start">
                   <img 
                      src={partner.logo} 
                      alt={`Logo ${partner.name}`} 
                      className="h-16 w-16 rounded-xl object-cover border border-slate-100 shadow-sm"
                   />
                </div>

                {/* Nom de l'entreprise en MAJUSCULES */}
                <h3 className="text-[18px] font-bold text-slate-900 uppercase leading-snug mb-6 line-clamp-3">
                  {partner.name}
                </h3>

                {/* Conteneur inférieur aligné vers le bas */}
                <div className="mt-auto flex flex-col gap-3">
                  
                  {/* Badge Secteur */}
                  <div>
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-md">
                      {partner.industry}
                    </span>
                  </div>

                  <div className="space-y-1.5 mt-1">
                    {/* Localisation */}
                    <div className="flex items-start gap-1.5 text-slate-600 text-[13px]">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="leading-tight">{partner.location}</span>
                    </div>

                    {/* Nombre d'offres */}
                    <div className="flex items-center gap-1.5 text-slate-600 text-[13px]">
                      <Briefcase className="w-4 h-4 flex-shrink-0" />
                      <span>{partner.openPositions} offre{partner.openPositions > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURES GRID */}
      <section className="py-24 px-6 max-w-7xl mx-auto bg-[#F8FAFC] border-y border-slate-200/60 rounded-3xl mt-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Pourquoi choisir MatchTalent ?</h2>
          <p className="text-slate-500 text-lg">Des fonctionnalités pensées pour un recrutement efficace</p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Recherche Optimisée</h3>
            <p className="text-slate-500 leading-relaxed">Notre système analyse les profils pour suggérer les meilleures correspondances.</p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Filtres Géolocalisés</h3>
            <p className="text-slate-500 leading-relaxed">Trouvez des opportunités près de chez vous ou en télétravail grâce à nos outils.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Processus Rapide</h3>
            <p className="text-slate-500 leading-relaxed">Inscription en 4 étapes simples et rapides pour commencer immédiatement.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">100% Sécurisé</h3>
            <p className="text-slate-500 leading-relaxed">Vos données sont protégées et vérifiées rigoureusement par nos équipes.</p>
          </div>
        </div>
      </section>

      {/* 4. ROLES */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Une solution pour chacun</h2>
          <p className="text-slate-500 text-lg">Que vous cherchiez un emploi ou recrutiez des talents</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold">Pour les candidats</h3>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-slate-600"><Check className="w-5 h-5 text-blue-600 flex-shrink-0" /> Mise en valeur intuitive de votre profil et CV</li>
              <li className="flex items-center gap-3 text-slate-600"><Check className="w-5 h-5 text-blue-600 flex-shrink-0" /> Recommandations personnalisées d'emplois</li>
              <li className="flex items-center gap-3 text-slate-600"><Check className="w-5 h-5 text-blue-600 flex-shrink-0" /> Alertes en temps réel pour les nouvelles opportunités</li>
              <li className="flex items-center gap-3 text-slate-600"><Check className="w-5 h-5 text-blue-600 flex-shrink-0" /> Suivi de vos candidatures en un coup d'œil</li>
            </ul>
            <button onClick={() => navigate('/register', { state: { role: 'candidate' } })} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors cursor-pointer">
              Je cherche un emploi
            </button>
          </div>

          <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold">Pour les recruteurs</h3>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-slate-600"><Check className="w-5 h-5 text-indigo-600 flex-shrink-0" /> Espace entreprise dédié et vérifié</li>
              <li className="flex items-center gap-3 text-slate-600"><Check className="w-5 h-5 text-indigo-600 flex-shrink-0" /> Accès à une CVthèque de talents qualifiés</li>
              <li className="flex items-center gap-3 text-slate-600"><Check className="w-5 h-5 text-indigo-600 flex-shrink-0" /> Mise en relation ciblée selon vos critères</li>
              <li className="flex items-center gap-3 text-slate-600"><Check className="w-5 h-5 text-indigo-600 flex-shrink-0" /> Gestion simplifiée de vos offres d'emploi</li>
            </ul>
            <button onClick={() => navigate('/register', { state: { role: 'recruiter' } })} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors cursor-pointer">
              Je recrute des talents
            </button>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-slate-900">Comment ça marche ?</h2>
          <p className="text-slate-500 text-lg">Un processus simple en 4 étapes</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-blue-200">
              1
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-800">Choisissez votre rôle</h3>
            <p className="text-slate-500 text-sm">Candidat ou Recruteur</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-blue-200">
              2
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-800">Créez votre profil</h3>
            <p className="text-slate-500 text-sm">En quelques clics</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-blue-200">
              3
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-800">Nous analysons</h3>
            <p className="text-slate-500 text-sm">Des recommandations précises</p>
          </div>

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
          <button onClick={() => navigate('/register')} className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer shadow-xl">
            Commencer maintenant <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-[#0B1120] pt-20 pb-10 px-6 border-t border-slate-800/60 rounded-t-3xl">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            
            <div className="col-span-1 md:col-span-1">
              <div className="text-2xl font-bold text-white tracking-tight mb-4">
                Match<span className="text-blue-500">Talent</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                La technologie au service de votre carrière et de vos recrutements. 
                Trouvez l'opportunité qui vous correspond vraiment.
              </p>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
                  <span className="text-xs font-bold">In</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-400 hover:text-white transition-all cursor-pointer">
                  <span className="text-xs font-bold">X</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Plateforme</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Comment ça marche</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Pour les candidats</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Pour les recruteurs</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Tarifs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Entreprise</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Carrières</a></li>
              </ul>
            </div>

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

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-xs">
              © 2026 MatchTalent. Fait avec passion pour le futur du travail.
            </p>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-slate-500 text-xs font-medium">Plateforme Opérationnelle</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;