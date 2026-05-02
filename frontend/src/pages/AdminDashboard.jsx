import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShieldCheck, Building, Users, LogOut, 
  Search, CheckCircle, XCircle, FileText, AlertTriangle, 
  Eye, ChevronRight, Check, Briefcase, Activity, Ban, RefreshCw, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo';
import toast, { Toaster } from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:5000/api/admin';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingRecruiters, setPendingRecruiters] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // NOUVEAU : État pour gérer le document en cours de visualisation
  const [docToView, setDocToView] = useState(null);

  // ==========================================
  // FONCTION DE DÉCONNEXION
  // ==========================================
const handleLogout = () => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('user');
    navigate('/login'); 
  };

  // ==========================================
  // APPELS API
  // ==========================================
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/stats`);
      if (res.ok) setStats(await res.json());
    } catch (error) { console.error("Erreur stats:", error); }
  };

  const fetchPendingRecruiters = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/recruteurs/en-attente`);
      if (res.ok) setPendingRecruiters(await res.json());
    } catch (error) { console.error("Erreur recruteurs en attente:", error); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users);
      }
    } catch (error) { console.error("Erreur utilisateurs:", error); }
  };

  const fetchDossier = async (id) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/recruteurs/${id}/dossier`);
      if (res.ok) setSelectedDossier(await res.json());
    } catch (error) { console.error("Erreur dossier:", error); } 
    finally { setIsLoading(false); }
  };

  const handleTriggerVerification = async (docId) => {
    try {
      // Note : La route documents est généralement hors de /admin, on utilise l'URL de base
      const res = await fetch(`http://localhost:5000/api/documents/${docId}/verify`, {
        method: 'POST'
      });
      
      if (res.ok) {
        // L'API répond tout de suite, mais l'analyse tourne en fond.
        // On rafraîchit le dossier après 3 secondes pour laisser le temps à l'IA de finir.
        setTimeout(() => {
          if (selectedDossier) fetchDossier(selectedDossier.recruteur._id);
        }, 3000);
      } else {
        console.error("Impossible de lancer l'analyse");
      }
    } catch (error) { 
      console.error("Erreur relance IA:", error); 
    }
  };

  const handleValidateDecision = async (id, decision) => {
    const toastId = toast.loading('Traitement en cours...');

    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}/validate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, motif: decision === 'refuse' ? 'Dossier non conforme' : '' })
      });
      
      if (res.ok) {
        // Success: Clear the dossier, refresh data, and show success toast
        setSelectedDossier(null);
        fetchPendingRecruiters();
        fetchStats();
        toast.success('Décision enregistrée avec succès !', { id: toastId });
      } else {
        // Fallback 1: Server responded with an error
        const errorData = await res.json().catch(() => ({}));
        console.error("Erreur API:", errorData);
        toast.error(`Échec : Le serveur a retourné une erreur ${res.status}.`, { id: toastId });
      }
    } catch (error) { 
      // Fallback 2: Server is completely unreachable
      console.error("Erreur validation:", error); 
      toast.error("Erreur réseau : Impossible de contacter le serveur (Port 5000).", { id: toastId });
    }
  };

  const handleToggleSuspend = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}/suspend`, { method: 'PATCH' });
      if (res.ok) {
        fetchUsers();
        fetchStats();
      }
    } catch (error) { console.error("Erreur suspension:", error); }
  };

  useEffect(() => {
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'approvals') fetchPendingRecruiters();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  // ==========================================
  // VUES (Vue d'ensemble, Validations, Utilisateurs)
  // ==========================================
  const renderOverview = () => {
    if (!stats) return (
      <div className="flex items-center justify-center h-[60vh] text-slate-500 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin"/> 
        <span className="text-lg font-medium">Chargement...</span>
      </div>
    );
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Vue d'ensemble</h2>
          <p className="text-slate-500 text-sm mt-1">Les performances de MatchTalent en un coup d'œil.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Candidats", value: stats.users.totalCandidats, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { title: "Recruteurs", value: stats.users.totalRecruteurs, icon: Building, color: "text-emerald-600", bg: "bg-emerald-50" },
            { title: "Offres Actives", value: stats.offres.ouvertes, icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-50" },
            { title: "En attente", value: stats.users.recruteursEnAttente + stats.users.recruteursValideParIA, icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-black text-slate-800">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-800">Activité de l'Intelligence Artificielle</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-6">
             <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
               <p className="text-slate-500 mb-1 font-medium">Total Matchs Effectués</p>
               <p className="text-2xl font-black text-slate-800">{stats.aiMatch?.totalMatchs || 0}</p>
             </div>
             <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
               <p className="text-emerald-700 mb-1 font-medium">Documents Approuvés</p>
               <p className="text-2xl font-black text-emerald-600">{stats.aiVerification.approuves}</p>
             </div>
             <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
               <p className="text-red-700 mb-1 font-medium">Documents Rejetés</p>
               <p className="text-2xl font-black text-red-600">{stats.aiVerification.rejetes}</p>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderApprovalsList = () => (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Vérification des Entreprises</h2>
          <p className="text-slate-500 text-sm mt-1">Examinez les dossiers en attente ou pré-validés par l'IA.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Rechercher..." className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-sm w-72" />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-sm border-b border-slate-100">
              <th className="font-medium py-4 px-6">Entreprise & Contact</th>
              <th className="font-medium py-4 px-6 text-center">Pré-analyse IA</th>
              <th className="font-medium py-4 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingRecruiters.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-12 text-center text-slate-500 font-medium">Aucune entreprise en attente de validation.</td>
              </tr>
            ) : (
              pendingRecruiters.map((recruteur) => (
                <tr key={recruteur._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 text-indigo-600 flex items-center justify-center font-bold">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 mb-0.5">{recruteur.nomEntreprise || recruteur.nom || 'Non spécifié'}</p>
                      <p className="text-xs text-slate-500">{recruteur.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center gap-1.5 font-bold text-sm px-3 py-1 rounded-lg ${recruteur.etatValidation === 'valideParIA' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {recruteur.etatValidation === 'valideParIA' ? <ShieldCheck className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />} 
                      {recruteur.etatValidation === 'valideParIA' ? 'Favorable' : 'En attente'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => fetchDossier(recruteur._id)} className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold transition-all">
                      Examiner <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestion des Utilisateurs</h2>
          <p className="text-slate-500 text-sm mt-1">Gérez tous les comptes Candidats et Recruteurs.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Rechercher..." className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-sm w-72" />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-sm border-b border-slate-100">
              <th className="font-medium py-4 px-6">Utilisateur</th>
              <th className="font-medium py-4 px-6">Rôle</th>
              <th className="font-medium py-4 px-6 text-center">Statut Compte</th>
              <th className="font-medium py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersList.map((user) => (
              <tr key={user._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6">
                  <p className="font-bold text-slate-800">{user.nom} {user.prenom}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </td>
                <td className="py-4 px-6 text-sm font-medium text-slate-600 capitalize">{user.role}</td>
                <td className="py-4 px-6 text-center">
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${user.statusCompte === 'actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {user.statusCompte}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <button 
                    onClick={() => handleToggleSuspend(user._id)}
                    className={`p-2 transition-colors ${user.statusCompte === 'actif' ? 'text-slate-400 hover:text-red-600' : 'text-red-500 hover:text-emerald-600'}`} 
                    title={user.statusCompte === 'actif' ? "Bloquer le compte" : "Réactiver le compte"}
                  >
                    <Ban className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Toaster position="top-right" reverseOrder={false} />
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col z-20">
        <div className="h-20 flex items-center px-8 border-b border-slate-200">
          <div className="h-20 flex items-center px-8 border-b border-slate-200">
            <Logo />
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 mt-2">Panel Admin</p>
          
          <button onClick={() => {setActiveTab('overview'); setSelectedDossier(null);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'overview' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
            <LayoutDashboard className="w-5 h-5" /> Vue d'ensemble
          </button>
          
          <button onClick={() => {setActiveTab('approvals'); setSelectedDossier(null);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'approvals' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
            <ShieldCheck className="w-5 h-5" /> Validations 
            {pendingRecruiters.length > 0 && (
              <span className="ml-auto bg-indigo-100 text-indigo-700 text-xs py-0.5 px-2 rounded-full font-bold">{pendingRecruiters.length}</span>
            )}
          </button>
          
          <button onClick={() => {setActiveTab('users'); setSelectedDossier(null);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Users className="w-5 h-5" /> Utilisateurs
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-200">
  <button 
    onClick={handleLogout} 
    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors"
  >
    <LogOut className="w-5 h-5" /> Déconnexion
  </button>
</div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <h2 className="text-xl font-bold text-slate-800">
            {selectedDossier ? `Dossier: ${selectedDossier.recruteur.nomEntreprise || selectedDossier.recruteur.nom}` : 
             activeTab === 'overview' ? 'Tableau de bord' :
             activeTab === 'users' ? 'Annuaire système' : 'Centre de Contrôle'}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Super Admin</span>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">SA</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
          )}

          {!isLoading && activeTab === 'overview' && !selectedDossier && renderOverview()}
          {!isLoading && activeTab === 'users' && !selectedDossier && renderUsers()}
          {!isLoading && activeTab === 'approvals' && !selectedDossier && renderApprovalsList()}

          {/* VUE DÉTAILLÉE DU DOSSIER */}
          {!isLoading && activeTab === 'approvals' && selectedDossier && (
             <div className="animate-fade-in max-w-5xl mx-auto">
             
             <button onClick={() => setSelectedDossier(null)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium mb-6 transition-colors">
               <ChevronRight className="w-5 h-5 rotate-180" /> Retour à la liste
             </button>

             <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden flex flex-col lg:flex-row">
               
               {/* Colonne Gauche */}
               <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-100 p-8 bg-slate-50/50 flex flex-col">
                 <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-slate-100 text-indigo-600 flex items-center justify-center mb-6">
                   <Building className="w-8 h-8" />
                 </div>
                 <h3 className="text-2xl font-black text-slate-800 mb-1">{selectedDossier.recruteur.nomEntreprise || selectedDossier.recruteur.nom}</h3>
                 <p className="text-sm text-slate-500 mb-6 flex items-center gap-2">
                   <Users className="w-4 h-4" /> Compte: {selectedDossier.recruteur.email}
                 </p>

                 <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-8">
                   <div className="flex justify-between items-center mb-4">
                     <span className="text-sm font-bold text-slate-700">Bilan de l'IA</span>
                     <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                       selectedDossier.recruteur.etatValidation === 'valideParIA' 
                       ? 'bg-emerald-100 text-emerald-700' 
                       : 'bg-amber-100 text-amber-700'
                     }`}>
                       {selectedDossier.recruteur.etatValidation === 'valideParIA' ? 'Favorable' : 'Vérification requise'}
                     </span>
                   </div>
                   
                   <div className="space-y-2 text-sm text-slate-600">
                     <div className="flex justify-between items-center">
                        <span>Documents valides</span>
                        <span className="font-bold text-emerald-600">{selectedDossier.aiSummary.approuves}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span>Documents rejetés</span>
                        <span className="font-bold text-red-600">{selectedDossier.aiSummary.rejetes}</span>
                     </div>
                     <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <span>À réviser manuellement</span>
                        <span className="font-bold text-amber-600">{selectedDossier.aiSummary.necessiteRevision}</span>
                     </div>
                   </div>
                 </div>

                 <div className="mt-auto space-y-3 pt-6 border-t border-slate-200">
                   <button onClick={() => handleValidateDecision(selectedDossier.recruteur._id, 'valideParAdmin')} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all">
                     <CheckCircle className="w-5 h-5" /> Valider l'entreprise
                   </button>
                   <button onClick={() => handleValidateDecision(selectedDossier.recruteur._id, 'refuse')} className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-red-500 text-slate-600 hover:text-red-600 hover:bg-red-50 py-3 rounded-xl font-bold transition-all">
                     <XCircle className="w-5 h-5" /> Refuser la demande
                   </button>
                 </div>
               </div>

               {/* Colonne Droite: Liste des documents */}
               <div className="w-full lg:w-2/3 p-8">
                 <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                   <FileText className="w-5 h-5 text-indigo-600" /> Documents soumis ({selectedDossier.documents.length})
                 </h4>
                 
                 <div className="space-y-4">
                   {selectedDossier.documents.length === 0 ? (
                     <p className="text-sm text-slate-500 italic">Aucun document téléversé.</p>
                   ) : (
                     selectedDossier.documents.map((doc) => {
                       const verdict = doc.aiVerification?.verdict || 'enAttente';
                       const isApprouve = verdict === 'approuve';
                       const isRejete = verdict === 'rejete';
                       
                       let iconColorClass = 'bg-amber-50 text-amber-600';
                       let badgeColorClass = 'bg-amber-100 text-amber-700';
                       let labelIA = 'À Réviser';

                       if (isApprouve) {
                         iconColorClass = 'bg-emerald-50 text-emerald-600';
                         badgeColorClass = 'bg-emerald-100 text-emerald-700';
                         labelIA = 'Conforme';
                       } else if (isRejete) {
                         iconColorClass = 'bg-red-50 text-red-600';
                         badgeColorClass = 'bg-red-100 text-red-700';
                         labelIA = 'Rejeté';
                       }

                       return (
                         <div key={doc._id} className="group border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
                           <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconColorClass}`}>
                               <FileText className="w-6 h-6" />
                             </div>
                             <div>
                               <p className="font-bold text-slate-800 text-sm">{doc.nomFichier || 'Document'}</p>
                               <div className="flex items-center gap-3 mt-1">
                                 <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                   Type: {doc.type || 'Non défini'}
                                 </span>
                                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${badgeColorClass}`}>
                                   {isApprouve ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />} 
                                   IA: {labelIA}
                                 </span>
                               </div>
                             </div>
                           </div>
                           
                           {/* BOUTON POUR OUVRIR LA MODALE */}
                           {/* BOUTONS D'ACTION (IA + Visualiser) */}
<div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-3 sm:mt-0">
  <button 
    onClick={() => handleTriggerVerification(doc._id)}
    title="Forcer une nouvelle analyse par l'IA"
    className="flex items-center justify-center gap-2 bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-600 border border-slate-200 hover:border-amber-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
  >
    <RefreshCw className="w-4 h-4" /> Relancer IA
  </button>
  
  <button 
    onClick={() => setDocToView(doc)}
    className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
  >
    <Eye className="w-4 h-4" /> Visualiser
  </button>
</div>
                         </div>
                       )
                     })
                   )}
                 </div>
               </div>
             </div>
           </div>
          )}
        </div>
      </main>

      {/* ========================================== */}
      {/* MODALE DE VISUALISATION DE DOCUMENT */}
      {/* ========================================== */}
      {docToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]">
            
            {/* Header de la modale */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${docToView.aiVerification?.verdict === 'approuve' ? 'bg-emerald-100 text-emerald-600' : docToView.aiVerification?.verdict === 'rejete' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{docToView.nomFichier || 'Document en cours d\'examen'}</h3>
                  <p className="text-xs text-slate-500 font-medium">Verdict IA : <span className="uppercase">{docToView.aiVerification?.verdict || 'Non vérifié'}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setDocToView(null)} 
                className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu de la modale (Iframe ou Image avec GridFS) */}
<div className="flex-1 bg-slate-100 p-4 overflow-auto min-h-[50vh] flex items-center justify-center">
  {docToView.fileId ? (
    // On vérifie le type de fichier via le formatFichier stocké dans la DB
    docToView.formatFichier && docToView.formatFichier.startsWith('image/') ? (
      <img 
        // Adaptez l'URL selon votre routeur backend (ex: /api/documents/download/:fileId)
        src={`http://localhost:5000/api/documents/download/${docToView.fileId}`} 
        alt={docToView.nomFichier} 
        className="max-w-full max-h-full rounded-lg shadow-sm border border-slate-200" 
      />
    ) : (
      <iframe 
        src={`http://localhost:5000/api/documents/download/${docToView.fileId}`} 
        title="Visionneuse de document"
        className="w-full h-full min-h-[60vh] rounded-xl border border-slate-200 bg-white shadow-sm"
      />
    )
  ) : (
     <div className="text-center text-slate-400 flex flex-col items-center">
       <AlertTriangle className="w-12 h-12 mb-3 text-slate-300" />
       <p className="font-medium text-slate-500">Fichier introuvable ou ID manquant.</p>
     </div>
  )}
</div>
            {/* Footer de la modale */}
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button onClick={() => setDocToView(null)} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors">
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}