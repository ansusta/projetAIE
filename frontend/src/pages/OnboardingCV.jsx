import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { cvService } from '../services/cv.service';
import { authService } from '../services/auth.service';

export default function OnboardingCV() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill name from the freshly-registered user stored in localStorage
  const storedUser = JSON.parse(localStorage.getItem('user')) || {};

  const [formData, setFormData] = useState({
    // Step 1 — profile summary (maps to CV titrePoste + user bio)
    titrePoste: '',
    bio: '',

    // Step 2 — experiences  (maps 1-to-1 with backend experienceSchema)
    experiences: [
      {
        id: 'temp-exp-1',
        poste: '',
        entreprise: '',
        localisation: '',
        dateDebut: '',
        dateFin: '',
        enCours: false,
        description: '',
      },
    ],

    // Step 3 — formations  (maps 1-to-1 with backend formationSchema)
    formations: [
      {
        id: 'emp-form-1',
        diplome: '',
        etablissement: '',
        domaine: '',
        dateDebut: '',
        dateFin: '',
        enCours: false,
        description: '',
      },
    ],

    // Step 4 — competences (array) + langues + loisirs
    competencesText: '', // comma-separated → split on submit
    langues: [
      { 
        id: 'temp-lang-1', 
        langue: '', 
        niveau: 
        'intermédiaire' 
      }
    ],
    loisirsText: '',     // comma-separated → split on submit
  });

  // ── Validation ────────────────────────────────────────────────────────────
  const isStep1Valid = formData.titrePoste.trim() !== '';
  const canGoNext = step === 1 ? isStep1Valid : true;

  const nextStep = () => { if (canGoNext) setStep(step + 1); };
  const prevStep = () => setStep(step - 1);

  // ── Dynamic list helpers ──────────────────────────────────────────────────
  const addEntry = (type) => {
    const templates = {
      experiences: {
        id: Date.now(), poste: '', entreprise: '', localisation: '',
        dateDebut: '', dateFin: '', enCours: false, description: '',
      },
      formations: {
        id: Date.now(), diplome: '', etablissement: '', domaine: '',
        dateDebut: '', dateFin: '', enCours: false, description: '',
      },
      langues: { id: Date.now(), langue: '', niveau: 'intermédiaire' },
    };
    setFormData({ ...formData, [type]: [...formData[type], templates[type]] });
  };

  const removeEntry = (type, id) =>
    setFormData({ ...formData, [type]: formData[type].filter((i) => i.id !== id) });

  const updateEntry = (type, id, field, value) => {
    const updated = formData[type].map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setFormData({ ...formData, [type]: updated });
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleComplete = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Strip the helper `id` field (only needed by React keys)
      const stripId = (arr) => arr.map(item => {
     const copy = { ...item };
    delete copy.id;
    return copy;
    });

      const cvPayload = {
        titrePoste: formData.titrePoste,
        experiences: stripId(formData.experiences).filter((e) => e.poste || e.entreprise),
        formations:  stripId(formData.formations).filter((f) => f.diplome || f.etablissement),
        competences: formData.competencesText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        langues: stripId(formData.langues).filter((l) => l.langue),
        loisirs: formData.loisirsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      await cvService.createOrReplace(cvPayload);

      // Persist bio on the user profile if provided
      if (formData.bio.trim()) {
        await authService.updateProfile({ bio: formData.bio });
      }

      // Refresh localStorage with latest user data
      const fresh = await authService.getMe();
      localStorage.setItem('user', JSON.stringify(fresh));

      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Une erreur est survenue. Veuillez réessayer.'
      );
      setIsLoading(false);
    }
  };

  // ── Shared input classes ──────────────────────────────────────────────────
  const input =
    'w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all text-slate-800 bg-white';
  const smallInput =
    'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none bg-white';

  const niveauOptions = ['débutant', 'intermédiaire', 'avancé', 'courant', 'natif'];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden">

        {/* ── Progress bar ── */}
        <div className="bg-slate-900 p-8 pb-12 text-white">
          <p className="text-sm text-slate-400 mb-6 text-center">
            Bonjour {storedUser.prenom || 'là'} 👋 &nbsp;Complétez votre CV en 4 étapes rapides.
          </p>
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-700 -translate-y-1/2 z-0" />
            {[
              { num: 1, label: 'PROFIL' },
              { num: 2, label: 'EXPÉRIENCES' },
              { num: 3, label: 'FORMATION' },
              { num: 4, label: 'COMPÉTENCES' },
            ].map((item) => (
              <div key={item.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                    step >= item.num
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {step > item.num ? <Check className="w-5 h-5" /> : item.num}
                </div>
                <span
                  className={`absolute top-14 text-[11px] font-bold tracking-wider whitespace-nowrap transition-colors ${
                    step >= item.num ? 'text-blue-100' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 md:p-12">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">
              {error}
            </div>
          )}

          {/* ── STEP 1 : Profil ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Votre profil</h2>
                <p className="text-slate-500">Ces infos aident l'IA à vous trouver les meilleurs matchs.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Titre du poste recherché <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.titrePoste}
                  onChange={(e) => setFormData({ ...formData, titrePoste: e.target.value })}
                  className={input}
                  placeholder="ex: Développeur Fullstack React / Node.js"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Bio / Résumé
                </label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className={input}
                  placeholder="Parlez de vos motivations, aspirations professionnelles…"
                />
              </div>
            </div>
          )}

          {/* ── STEP 2 : Experiences ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Expériences</h2>
                  <p className="text-slate-500">Ajoutez vos postes professionnels.</p>
                </div>
                <button
                  onClick={() => addEntry('experiences')}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors font-semibold"
                >
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
              </div>

              <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-1">
                {formData.experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-5 border border-slate-100 rounded-2xl bg-slate-50 relative group"
                  >
                    {formData.experiences.length > 1 && (
                      <button
                        onClick={() => removeEntry('experiences', exp.id)}
                        className="absolute -top-2 -right-2 bg-white text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Intitulé du poste *"
                        value={exp.poste}
                        onChange={(e) => updateEntry('experiences', exp.id, 'poste', e.target.value)}
                        className={smallInput}
                      />
                      <input
                        type="text"
                        placeholder="Entreprise *"
                        value={exp.entreprise}
                        onChange={(e) => updateEntry('experiences', exp.id, 'entreprise', e.target.value)}
                        className={smallInput}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Localisation"
                        value={exp.localisation}
                        onChange={(e) => updateEntry('experiences', exp.id, 'localisation', e.target.value)}
                        className={smallInput}
                      />
                      <input
                        type="month"
                        placeholder="Début"
                        value={exp.dateDebut}
                        onChange={(e) => updateEntry('experiences', exp.id, 'dateDebut', e.target.value)}
                        className={smallInput}
                      />
                      <input
                        type="month"
                        placeholder="Fin"
                        value={exp.dateFin}
                        disabled={exp.enCours}
                        onChange={(e) => updateEntry('experiences', exp.id, 'dateFin', e.target.value)}
                        className={`${smallInput} disabled:opacity-40`}
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-600 mb-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exp.enCours}
                        onChange={(e) => updateEntry('experiences', exp.id, 'enCours', e.target.checked)}
                        className="accent-blue-600"
                      />
                      Poste actuel
                    </label>

                    <textarea
                      placeholder="Description des missions…"
                      value={exp.description}
                      onChange={(e) => updateEntry('experiences', exp.id, 'description', e.target.value)}
                      className={smallInput}
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3 : Formations ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Formation</h2>
                  <p className="text-slate-500">Diplômes et certifications.</p>
                </div>
                <button
                  onClick={() => addEntry('formations')}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors font-semibold"
                >
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
              </div>

              <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-1">
                {formData.formations.map((edu) => (
                  <div
                    key={edu.id}
                    className="p-5 border border-slate-100 rounded-2xl bg-slate-50 relative group space-y-3"
                  >
                    {formData.formations.length > 1 && (
                      <button
                        onClick={() => removeEntry('formations', edu.id)}
                        className="absolute -top-2 -right-2 bg-white text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Diplôme *"
                        value={edu.diplome}
                        onChange={(e) => updateEntry('formations', edu.id, 'diplome', e.target.value)}
                        className={smallInput}
                      />
                      <input
                        type="text"
                        placeholder="Établissement *"
                        value={edu.etablissement}
                        onChange={(e) => updateEntry('formations', edu.id, 'etablissement', e.target.value)}
                        className={smallInput}
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Domaine d'études (ex: Informatique)"
                      value={edu.domaine}
                      onChange={(e) => updateEntry('formations', edu.id, 'domaine', e.target.value)}
                      className={smallInput}
                    />

                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="month"
                        placeholder="Début"
                        value={edu.dateDebut}
                        onChange={(e) => updateEntry('formations', edu.id, 'dateDebut', e.target.value)}
                        className={smallInput}
                      />
                      <input
                        type="month"
                        placeholder="Fin"
                        value={edu.dateFin}
                        disabled={edu.enCours}
                        onChange={(e) => updateEntry('formations', edu.id, 'dateFin', e.target.value)}
                        className={`${smallInput} disabled:opacity-40`}
                      />
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={edu.enCours}
                          onChange={(e) => updateEntry('formations', edu.id, 'enCours', e.target.checked)}
                          className="accent-blue-600"
                        />
                        En cours
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 4 : Compétences, Langues, Loisirs ── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Compétences & Langues</h2>
                <p className="text-slate-500">Les derniers détails qui font la différence.</p>
              </div>

              {/* Compétences */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Compétences <span className="text-slate-400 font-normal">(séparées par des virgules)</span>
                </label>
                <input
                  type="text"
                  value={formData.competencesText}
                  onChange={(e) => setFormData({ ...formData, competencesText: e.target.value })}
                  className={input}
                  placeholder="ex: React, Node.js, Python, Figma, Agile"
                />
              </div>

              {/* Langues */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-slate-700">Langues</label>
                  <button
                    onClick={() => addEntry('langues')}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg font-semibold"
                  >
                    <Plus className="w-3 h-3" /> Ajouter
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.langues.map((l) => (
                    <div key={l.id} className="flex gap-3 items-center">
                      <input
                        type="text"
                        placeholder="Langue (ex: Anglais)"
                        value={l.langue}
                        onChange={(e) => updateEntry('langues', l.id, 'langue', e.target.value)}
                        className={`${smallInput} flex-1`}
                      />
                      <select
                        value={l.niveau}
                        onChange={(e) => updateEntry('langues', l.id, 'niveau', e.target.value)}
                        className={`${smallInput} flex-1`}
                      >
                        {niveauOptions.map((n) => (
                          <option key={n} value={n}>
                            {n.charAt(0).toUpperCase() + n.slice(1)}
                          </option>
                        ))}
                      </select>
                      {formData.langues.length > 1 && (
                        <button
                          onClick={() => removeEntry('langues', l.id)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Loisirs */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Centres d'intérêt <span className="text-slate-400 font-normal">(séparés par des virgules, optionnel)</span>
                </label>
                <input
                  type="text"
                  value={formData.loisirsText}
                  onChange={(e) => setFormData({ ...formData, loisirsText: e.target.value })}
                  className={input}
                  placeholder="ex: Open source, Escalade, Photographie"
                />
              </div>
            </div>
          )}

          {/* ── Navigation buttons ── */}
          <div className="mt-10 flex justify-between gap-4">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" /> Retour
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={step === 4 ? handleComplete : nextStep}
              disabled={!canGoNext || isLoading}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
                canGoNext && !isLoading
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Enregistrement…
                </>
              ) : step === 4 ? (
                "Terminer l'inscription"
              ) : (
                <>
                  Continuer <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}