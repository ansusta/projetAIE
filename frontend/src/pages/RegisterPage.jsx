import React, { useState, useRef, useCallback } from 'react';
import {
  User, Briefcase, Eye, EyeOff, ChevronLeft, Building, Sparkles,
  CheckCircle, MapPin, Phone, Calendar, Loader2,
  Upload, X, FileText, AlertCircle, CheckCircle2, File,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { uploadRecruteurDoc } from '../services/document.service';

// ── Document type options the recruiter can label each file ───────────────────
const DOC_TYPES = [
  { value: 'rc',      label: 'Registre du Commerce' },
  { value: 'nif',     label: 'NIF'                  },
  { value: 'cni',     label: "Carte d'Identité"     },
  { value: 'statuts', label: "Statuts de société"   },
  { value: 'autre',   label: 'Autre document'        },
];

// ── Accepted MIME types (mirrors backend multer config) ───────────────────────
const ACCEPTED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
];
const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp';

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatSize = (bytes) => {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileIcon = (mime) => {
  if (mime === 'application/pdf')      return '📄';
  if (mime.startsWith('image/'))       return '🖼️';
  return '📝';
};

// ── Single staged-file row ────────────────────────────────────────────────────
function FileRow({ entry, onTypeChange, onRemove, uploadStatus }) {
  // uploadStatus: null | 'uploading' | 'done' | 'error'
  const { file, type, id } = entry;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
      uploadStatus === 'done'      ? 'bg-green-50 border-green-200'  :
      uploadStatus === 'error'     ? 'bg-red-50 border-red-200'      :
      uploadStatus === 'uploading' ? 'bg-indigo-50 border-indigo-200':
                                     'bg-white border-slate-200'
    }`}>
      {/* Icon */}
      <span className="text-xl shrink-0">{fileIcon(file.type)}</span>

      {/* Name + size */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
        <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
      </div>

      {/* Type selector */}
      {uploadStatus == null && (
        <select
          value={type}
          onChange={e => onTypeChange(id, e.target.value)}
          className="text-xs font-medium px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300 shrink-0"
        >
          {DOC_TYPES.map(d => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      )}

      {/* Status indicator */}
      {uploadStatus === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-indigo-500 shrink-0" />}
      {uploadStatus === 'done'      && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
      {uploadStatus === 'error'     && <AlertCircle  className="w-4 h-4 text-red-500 shrink-0" />}

      {/* Remove (only before upload starts) */}
      {uploadStatus == null && (
        <button
          type="button"
          onClick={() => onRemove(id)}
          className="p-1 text-slate-300 hover:text-red-500 transition-colors shrink-0 rounded-lg hover:bg-red-50"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main RegisterPage
// ─────────────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const location     = useLocation();
  const initialRole  = location.state?.role || null;

  const [step, setStep]               = useState(initialRole ? 1 : 0);
  const [role, setRole]               = useState(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState('');

  // ── Staged documents (step 3 only) ─────────────────────────────────────────
  // Each entry: { id, file, type }
  const [stagedFiles, setStagedFiles]   = useState([]);
  // Per-file upload status after registration: { [id]: 'uploading'|'done'|'error' }
  const [uploadStatus, setUploadStatus] = useState({});
  const [isDragging, setIsDragging]     = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    email: '', password: '', phone: '',
    streetNumber: '', streetName: '', addressComplement: '',
    zipCode: '', city: '', region: '', country: 'Algérie',
    firstName: '', lastName: '', birthDate: '', bio: '', genre: 'nonSpecifie',
    companyName: '', industry: '', description: '',
  });

  const GENRE_OPTIONS = [
    { value: 'homme',        label: 'Homme'                   },
    { value: 'femme',        label: 'Femme'                   },
    { value: 'nonSpecifie',  label: 'Préfère ne pas préciser' },
  ];

  const navigate = useNavigate();

  const handleNext = (e) => { if (e) e.preventDefault(); setError(''); setStep(p => p + 1); };
  const handleBack = () => { setError(''); setStep(p => p - 1); };

  // ── File staging helpers ───────────────────────────────────────────────────
  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList);
    const valid    = incoming.filter(f => {
      if (!ACCEPTED_MIME.includes(f.type)) return false;
      if (f.size > 10 * 1024 * 1024)      return false; // 10 MB cap
      return true;
    });

    const rejected = incoming.length - valid.length;
    if (rejected > 0) {
      setError(`${rejected} fichier(s) ignoré(s) : format non supporté ou taille > 10 Mo.`);
    }

    setStagedFiles(prev => [
      ...prev,
      ...valid.map(f => ({ id: `${Date.now()}-${Math.random()}`, file: f, type: 'autre' })),
    ]);
  }, []);

  const handleFileInput = (e) => {
    addFiles(e.target.files);
    e.target.value = '';           // allow re-selecting same file
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (id) =>
    setStagedFiles(prev => prev.filter(f => f.id !== id));

  const changeType = (id, type) =>
    setStagedFiles(prev => prev.map(f => f.id === id ? { ...f, type } : f));

  // ── Registration + upload ─────────────────────────────────────────────────
  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Create the account (token is stored in localStorage by authService)
      if (role === 'candidate') {
        await authService.registerCandidate(formData);
        localStorage.setItem('userRole', 'candidate');
        navigate('/onboarding');
        return;
      }

      // Recruiter path
      await authService.registerRecruiter(formData);
      localStorage.setItem('userRole', 'recruiter');

      // 2. Upload each staged document sequentially using the fresh token
      if (stagedFiles.length > 0) {
        const newStatus = {};
        stagedFiles.forEach(f => { newStatus[f.id] = 'uploading'; });
        setUploadStatus(newStatus);

        for (const entry of stagedFiles) {
          try {
            await uploadRecruteurDoc(entry.file, entry.type);
            setUploadStatus(prev => ({ ...prev, [entry.id]: 'done' }));
          } catch (uploadErr) {
            console.error(`Upload failed for ${entry.file.name}:`, uploadErr.message);
            setUploadStatus(prev => ({ ...prev, [entry.id]: 'error' }));
            // Continue uploading the rest even if one fails
          }
        }

        // Brief pause so the user sees the green checkmarks
        await new Promise(r => setTimeout(r, 800));
      }

      navigate('/unverifiedRecruteur');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Une erreur est survenue lors de l'inscription."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived upload summary ────────────────────────────────────────────────
  const uploadDoneCount   = Object.values(uploadStatus).filter(s => s === 'done').length;
  const uploadErrorCount  = Object.values(uploadStatus).filter(s => s === 'error').length;
  const isUploading       = Object.values(uploadStatus).some(s => s === 'uploading');
  const uploadStarted     = Object.keys(uploadStatus).length > 0;

  const inp = (focus = 'blue') =>
    `w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-${focus}-600 outline-none text-slate-700 bg-white transition-all`;

  // ─────────────────────────────────────────────────────────────────────────
  // Step renders
  // ─────────────────────────────────────────────────────────────────────────

  const renderRoleSelection = () => (
    <div className="flex flex-col items-center animate-fade-in w-full max-w-4xl">
      <button
        onClick={() => navigate('/')}
        className="self-start mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors"
      >
        <ChevronLeft className="w-5 h-5" /> Retour à l'accueil
      </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-blue-600 tracking-tight mb-2">MatchTalent</h1>
        <p className="text-slate-500 font-medium">Votre plateforme de recrutement intelligente</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full">
        <button
          onClick={() => { setRole('candidate'); setStep(1); }}
          className="bg-white p-10 rounded-3xl shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:shadow-blue-900/10 transition-all border-2 border-transparent hover:border-blue-100 group text-center flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <User className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Je cherche un emploi</h2>
          <p className="text-slate-500 text-sm">Créez votre profil candidat et trouvez les opportunités qui vous correspondent</p>
        </button>

        <button
          onClick={() => { setRole('recruiter'); setStep(1); }}
          className="bg-white p-10 rounded-3xl shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:shadow-blue-900/10 transition-all border-2 border-transparent hover:border-indigo-100 group text-center flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Briefcase className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Je recrute des talents</h2>
          <p className="text-slate-500 text-sm">Publiez vos offres et découvrez les meilleurs candidats pour votre entreprise</p>
        </button>
      </div>
    </div>
  );

  // ── Candidate step 1
  const renderCandidateStep1 = () => (
    <form onSubmit={handleNext} className="bg-white p-10 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-xl animate-fade-in">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Créez votre compte</h2>
      <p className="text-slate-500 mb-8">Commençons par vos informations de connexion</p>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Adresse email</label>
          <input required type="email" placeholder="exemple@email.com" className={inp()}
            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
          <div className="relative">
            <input required type={showPassword ? 'text' : 'password'} placeholder="••••••••" className={`${inp()} pr-12`}
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            <button onClick={() => setShowPassword(!showPassword)} type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
          <div className="relative">
            <Phone className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input required type="tel" placeholder="06 12 34 56 78" className={`${inp()} pl-12`}
              value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-10">
        <button type="button" onClick={handleBack} className="flex items-center text-slate-500 hover:text-slate-800 font-medium">
          <ChevronLeft className="w-5 h-5 mr-1" /> Retour
        </button>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold w-1/2">
          Continuer
        </button>
      </div>
    </form>
  );

  // ── Candidate step 2
  const renderCandidateStep2 = () => (
    <form onSubmit={handleRegister} className="bg-white p-10 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-xl animate-fade-in">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Vos informations</h2>
      <p className="text-slate-500 mb-6">Parlez-nous un peu de vous</p>
      {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">{error}</div>}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Prénom</label>
            <input required type="text" placeholder="Jean" className={inp()}
              value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nom</label>
            <input required type="text" placeholder="Dupont" className={inp()}
              value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Date de naissance</label>
          <div className="relative">
            <Calendar className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input required type="date" className={`${inp()} pl-12`}
              value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Genre</label>
          <div className="grid grid-cols-3 gap-3">
            {GENRE_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => setFormData({...formData, genre: opt.value})}
                className={`px-3 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                  formData.genre === opt.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}>
                {formData.genre === opt.value && <span className="mr-1">✓</span>}
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Votre Adresse
          </p>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">N°</label>
              <input type="text" placeholder="12" className={inp()}
                value={formData.streetNumber} onChange={e => setFormData({...formData, streetNumber: e.target.value})} />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-medium text-slate-500 mb-1">Nom de la rue</label>
              <input type="text" placeholder="Rue de la Paix" className={inp()}
                value={formData.streetName} onChange={e => setFormData({...formData, streetName: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Code Postal</label>
              <input type="text" placeholder="16000" className={inp()}
                value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Ville</label>
              <input type="text" placeholder="Alger" className={inp()}
                value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-10">
        <button type="button" onClick={handleBack} className="flex items-center text-slate-500 hover:text-slate-800 font-medium">
          <ChevronLeft className="w-5 h-5 mr-1" /> Retour
        </button>
        <button type="submit" disabled={isLoading}
          className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold w-1/2 ${isLoading ? 'bg-blue-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
          {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Création…</> : 'Créer mon compte'}
        </button>
      </div>
    </form>
  );

  // ── Recruiter step 1
  const renderRecruiterStep1 = () => (
    <form onSubmit={handleNext} className="bg-white p-10 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-xl animate-fade-in">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Compte Recruteur</h2>
      <p className="text-slate-500 mb-8">Commençons par vos informations de connexion</p>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Adresse email</label>
          <input required type="email" placeholder="rh@entreprise.com" className={inp('indigo')}
            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
          <div className="relative">
            <input required type={showPassword ? 'text' : 'password'} placeholder="••••••••" className={`${inp('indigo')} pr-12`}
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            <button onClick={() => setShowPassword(!showPassword)} type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone professionnel</label>
          <div className="relative">
            <Phone className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input required type="tel" placeholder="01 23 45 67 89" className={`${inp('indigo')} pl-12`}
              value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-10">
        <button type="button" onClick={handleBack} className="flex items-center text-slate-500 hover:text-slate-800 font-medium">
          <ChevronLeft className="w-5 h-5 mr-1" /> Retour
        </button>
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold w-1/2">
          Continuer
        </button>
      </div>
    </form>
  );

  // ── Recruiter step 2
  const renderRecruiterStep2 = () => (
    <form onSubmit={handleNext} className="bg-white p-10 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-xl animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Building className="w-8 h-8 text-indigo-600" />
        <h2 className="text-3xl font-bold text-slate-900">Informations entreprise</h2>
      </div>
      <p className="text-slate-500 mb-6">Présentez votre entreprise</p>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nom de l'entreprise</label>
            <input required type="text" placeholder="Ex: TechCorp" className={inp('indigo')}
              value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Secteur d'activité</label>
            <select required className={`${inp('indigo')} bg-white`}
              value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})}>
              <option value="">Sélectionnez</option>
              <option>Informatique / Digital</option>
              <option>Finance</option>
              <option>Santé</option>
              <option>Autre</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description rapide</label>
          <textarea rows="2" placeholder="Que fait votre entreprise ?" className={inp('indigo')}
            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>
        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 space-y-4">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-500" /> Siège Social
          </p>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">N°</label>
              <input type="text" placeholder="12" className={inp('indigo')}
                value={formData.streetNumber} onChange={e => setFormData({...formData, streetNumber: e.target.value})} />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-medium text-slate-500 mb-1">Nom de la rue</label>
              <input type="text" placeholder="Avenue de l'Entreprise" className={inp('indigo')}
                value={formData.streetName} onChange={e => setFormData({...formData, streetName: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Code Postal</label>
              <input type="text" placeholder="16000" className={inp('indigo')}
                value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Ville</label>
              <input type="text" placeholder="Alger" className={inp('indigo')}
                value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-8">
        <button type="button" onClick={handleBack} className="flex items-center text-slate-500 hover:text-slate-800 font-medium">
          <ChevronLeft className="w-5 h-5 mr-1" /> Retour
        </button>
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold w-1/2">
          Continuer
        </button>
      </div>
    </form>
  );

  // ── Recruiter step 3 — DOCUMENT UPLOAD ─────────────────────────────────────
  const renderRecruiterStep3 = () => (
    <form
      onSubmit={handleRegister}
      className="bg-white p-10 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-xl animate-fade-in"
    >
      <div className="flex items-center gap-3 mb-2">
        <Sparkles className="w-8 h-8 text-indigo-600" />
        <h2 className="text-3xl font-bold text-slate-900">Documents entreprise</h2>
      </div>
      <p className="text-indigo-600 font-medium mb-1">Dernière étape pour vérifier votre compte</p>
      <p className="text-slate-400 text-sm mb-6">
        Ajoutez vos justificatifs (KBIS, NIF, CNI, statuts…). Vous pouvez en ajouter plusieurs.
        Cette étape est optionnelle — vous pourrez en ajouter plus tard depuis votre espace.
      </p>

      {error && (
        <div className="mb-5 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Upload progress summary — shown once uploading starts */}
      {uploadStarted && (
        <div className={`mb-5 p-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${
          uploadErrorCount > 0
            ? 'bg-red-50 border-red-200 text-red-700'
            : isUploading
            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          {isUploading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi des documents en cours…</>
            : uploadErrorCount > 0
            ? <><AlertCircle className="w-4 h-4" /> {uploadDoneCount} envoyé(s), {uploadErrorCount} échoué(s).</>
            : <><CheckCircle2 className="w-4 h-4" /> Tous les documents ont été envoyés.</>}
        </div>
      )}

      {/* Drop zone */}
      {!uploadStarted && (
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all mb-4 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS}
            className="hidden"
            onChange={handleFileInput}
          />
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-indigo-200' : 'bg-indigo-100'}`}>
            <Upload className={`w-7 h-7 ${isDragging ? 'text-indigo-700' : 'text-indigo-500'}`} />
          </div>
          <p className="font-bold text-slate-800 mb-1">
            {isDragging ? 'Déposez ici…' : 'Glissez-déposez vos fichiers ici'}
          </p>
          <p className="text-sm text-slate-500 mb-3">ou cliquez pour sélectionner</p>
          <p className="text-xs text-slate-400">PDF, Word, JPG, PNG, WebP · max 10 Mo par fichier</p>
        </div>
      )}

      {/* Staged file list */}
      {stagedFiles.length > 0 && (
        <div className="space-y-2 mb-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            {stagedFiles.length} fichier{stagedFiles.length > 1 ? 's' : ''} sélectionné{stagedFiles.length > 1 ? 's' : ''}
          </p>
          {stagedFiles.map(entry => (
            <FileRow
              key={entry.id}
              entry={entry}
              onTypeChange={changeType}
              onRemove={removeFile}
              uploadStatus={uploadStatus[entry.id] ?? null}
            />
          ))}

          {/* Add more files button — hidden once upload starts */}
          {!uploadStarted && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full mt-1 flex items-center justify-center gap-2 text-sm text-indigo-600 font-semibold py-2.5 rounded-xl border border-dashed border-indigo-200 hover:bg-indigo-50 transition-colors"
            >
              <Upload className="w-4 h-4" /> Ajouter d'autres fichiers
            </button>
          )}
        </div>
      )}

      {/* No files note */}
      {stagedFiles.length === 0 && (
        <p className="text-xs text-center text-slate-400 mb-5 -mt-1">
          Vous pouvez aussi ignorer cette étape et uploader vos documents plus tard.
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-2">
        <button
          type="button"
          onClick={handleBack}
          disabled={isLoading}
          className="flex items-center text-slate-500 hover:text-slate-800 font-medium disabled:opacity-40"
        >
          <ChevronLeft className="w-5 h-5 mr-1" /> Retour
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold w-1/2 transition-all ${
            isLoading
              ? 'bg-indigo-400 cursor-not-allowed text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {isLoading
            ? isUploading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Envoi…</>
              : <><Loader2 className="w-5 h-5 animate-spin" /> Création…</>
            : <><CheckCircle className="w-5 h-5" /> Terminer</>}
        </button>
      </div>
    </form>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Shell
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8">
      {step > 0 && (
        <div className="mb-8 cursor-pointer" onClick={() => navigate('/')}>
          <h1 className="text-2xl font-bold text-blue-600">MatchTalent.</h1>
        </div>
      )}

      {step === 0 && renderRoleSelection()}

      {role === 'candidate' && (
        <>
          {step === 1 && renderCandidateStep1()}
          {step === 2 && renderCandidateStep2()}
        </>
      )}

      {role === 'recruiter' && (
        <>
          {step === 1 && renderRecruiterStep1()}
          {step === 2 && renderRecruiterStep2()}
          {step === 3 && renderRecruiterStep3()}
        </>
      )}
    </div>
  );
}