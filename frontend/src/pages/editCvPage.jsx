import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Save, Plus, Trash2, Loader2,
  Briefcase, GraduationCap, Code2, Globe, Heart,
} from 'lucide-react';
import { cvService } from '../services/cv.service';

const niveauOptions = ['débutant', 'intermédiaire', 'avancé', 'courant', 'natif'];

const inp    = 'w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-700 bg-white transition-shadow';
const small  = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none bg-white text-slate-700';

export default function EditCVPage() {
  const navigate = useNavigate();

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const [titrePoste,   setTitrePoste]   = useState('');
  const [competences,  setCompetences]  = useState('');  // comma string
  const [loisirsText,  setLoisirsText]  = useState('');  // comma string

  const [experiences,  setExperiences]  = useState([]);
  const [formations,   setFormations]   = useState([]);
  const [langues,      setLangues]      = useState([]);

  // ── Load existing CV ──────────────────────────────────────────────────────
  useEffect(() => {
    cvService.getMyCV()
      .then(cv => {
        setTitrePoste(cv.titrePoste || '');
        setCompetences((cv.competences || []).join(', '));
        setLoisirsText((cv.loisirs    || []).join(', '));
        setExperiences((cv.experiences || []).map(e => ({ ...e, id: e._id || Date.now() + Math.random() })));
        setFormations( (cv.formations  || []).map(f => ({ ...f, id: f._id || Date.now() + Math.random() })));
        setLangues(    (cv.langues     || []).map(l => ({ ...l, id: l._id || Date.now() + Math.random() })));
      })
      .catch(() => setError('Impossible de charger le CV.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Generic list helpers ──────────────────────────────────────────────────
  const addExp = () => setExperiences(prev => [...prev, {
    id: Date.now(), poste: '', entreprise: '', localisation: '',
    dateDebut: '', dateFin: '', enCours: false, description: '',
  }]);
  const removeExp = id => setExperiences(prev => prev.filter(x => x.id !== id));
  const updateExp = (id, k, v) => setExperiences(prev =>
    prev.map(x => x.id === id ? { ...x, [k]: v } : x));

  const addFm = () => setFormations(prev => [...prev, {
    id: Date.now(), diplome: '', etablissement: '', domaine: '',
    dateDebut: '', dateFin: '', enCours: false,
  }]);
  const removeFm = id => setFormations(prev => prev.filter(x => x.id !== id));
  const updateFm = (id, k, v) => setFormations(prev =>
    prev.map(x => x.id === id ? { ...x, [k]: v } : x));

  const addLang = () => setLangues(prev => [...prev, { id: Date.now(), langue: '', niveau: 'intermédiaire' }]);
  const removeLang = id => setLangues(prev => prev.filter(x => x.id !== id));
  const updateLang = (id, k, v) => setLangues(prev =>
    prev.map(x => x.id === id ? { ...x, [k]: v } : x));

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const strip = arr => arr.map(({ id, ...rest }) => rest);
      await cvService.update({
        titrePoste,
        competences:  competences.split(',').map(s => s.trim()).filter(Boolean),
        loisirs:      loisirsText.split(',').map(s => s.trim()).filter(Boolean),
        experiences:  strip(experiences).filter(e => e.poste || e.entreprise),
        formations:   strip(formations).filter(f => f.diplome || f.etablissement),
        langues:      strip(langues).filter(l => l.langue),
      });
      setSuccess('CV mis à jour avec succès !');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')}
              className="p-2 bg-white hover:bg-slate-100 rounded-full shadow-sm transition-colors">
              <ChevronLeft className="w-6 h-6 text-slate-500" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Modifier mon CV</h2>
              <p className="text-slate-500 text-sm">Les modifications sont sauvegardées et analysées par l'IA</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 transition-all shadow-md shadow-blue-200">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">{error}</div>
        )}
        {success && (
          <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm">{success}</div>
        )}

        {/* Titre du poste */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Titre du poste recherché
          </label>
          <input type="text" className={inp} value={titrePoste}
            placeholder="ex: Développeur Fullstack React / Node.js"
            onChange={e => setTitrePoste(e.target.value)} />
        </div>

        {/* Compétences */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-600" /> Compétences
          </h3>
          <input type="text" className={inp} value={competences}
            placeholder="ex: React, Node.js, Python, MongoDB…"
            onChange={e => setCompetences(e.target.value)} />
          <p className="text-xs text-slate-400 mt-1.5">Séparez par des virgules</p>
        </div>

        {/* Expériences */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" /> Expériences
            </h3>
            <button onClick={addExp}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>

          <div className="space-y-5">
            {experiences.length === 0 && (
              <p className="text-sm text-slate-400 italic text-center py-4">Aucune expérience ajoutée</p>
            )}
            {experiences.map(exp => (
              <div key={exp.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group space-y-3">
                <button onClick={() => removeExp(exp.id)}
                  className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Intitulé du poste *" value={exp.poste}
                    className={small}
                    onChange={e => updateExp(exp.id, 'poste', e.target.value)} />
                  <input type="text" placeholder="Entreprise *" value={exp.entreprise}
                    className={small}
                    onChange={e => updateExp(exp.id, 'entreprise', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" placeholder="Localisation" value={exp.localisation}
                    className={small}
                    onChange={e => updateExp(exp.id, 'localisation', e.target.value)} />
                  <input type="month" placeholder="Début" value={exp.dateDebut?.slice(0, 7) || ''}
                    className={small}
                    onChange={e => updateExp(exp.id, 'dateDebut', e.target.value)} />
                  <input type="month" placeholder="Fin" value={exp.dateFin?.slice(0, 7) || ''}
                    disabled={exp.enCours} className={`${small} disabled:opacity-40`}
                    onChange={e => updateExp(exp.id, 'dateFin', e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={exp.enCours} className="accent-blue-600"
                    onChange={e => updateExp(exp.id, 'enCours', e.target.checked)} />
                  Poste actuel
                </label>
                <textarea rows={2} placeholder="Description des missions…" value={exp.description}
                  className={small}
                  onChange={e => updateExp(exp.id, 'description', e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        {/* Formations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" /> Formation
            </h3>
            <button onClick={addFm}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>

          <div className="space-y-5">
            {formations.length === 0 && (
              <p className="text-sm text-slate-400 italic text-center py-4">Aucune formation ajoutée</p>
            )}
            {formations.map(fm => (
              <div key={fm.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative space-y-3">
                <button onClick={() => removeFm(fm.id)}
                  className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Diplôme *" value={fm.diplome}
                    className={small}
                    onChange={e => updateFm(fm.id, 'diplome', e.target.value)} />
                  <input type="text" placeholder="Établissement *" value={fm.etablissement}
                    className={small}
                    onChange={e => updateFm(fm.id, 'etablissement', e.target.value)} />
                </div>
                <input type="text" placeholder="Domaine d'études" value={fm.domaine}
                  className={small}
                  onChange={e => updateFm(fm.id, 'domaine', e.target.value)} />
                <div className="grid grid-cols-3 gap-3 items-center">
                  <input type="month" value={fm.dateDebut?.slice(0, 7) || ''}
                    className={small}
                    onChange={e => updateFm(fm.id, 'dateDebut', e.target.value)} />
                  <input type="month" value={fm.dateFin?.slice(0, 7) || ''}
                    disabled={fm.enCours} className={`${small} disabled:opacity-40`}
                    onChange={e => updateFm(fm.id, 'dateFin', e.target.value)} />
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={fm.enCours} className="accent-indigo-600"
                      onChange={e => updateFm(fm.id, 'enCours', e.target.checked)} />
                    En cours
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Langues */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Globe className="w-5 h-5 text-green-600" /> Langues
            </h3>
            <button onClick={addLang}
              className="flex items-center gap-1.5 text-sm text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-lg font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
          <div className="space-y-2">
            {langues.length === 0 && (
              <p className="text-sm text-slate-400 italic text-center py-4">Aucune langue ajoutée</p>
            )}
            {langues.map(l => (
              <div key={l.id} className="flex gap-3 items-center">
                <input type="text" placeholder="Langue (ex: Anglais)" value={l.langue}
                  className={`${small} flex-1`}
                  onChange={e => updateLang(l.id, 'langue', e.target.value)} />
                <select value={l.niveau} className={`${small} flex-1`}
                  onChange={e => updateLang(l.id, 'niveau', e.target.value)}>
                  {niveauOptions.map(n => (
                    <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
                  ))}
                </select>
                <button onClick={() => removeLang(l.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Loisirs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Heart className="w-5 h-5 text-orange-500" /> Centres d'intérêt
          </h3>
          <input type="text" className={inp} value={loisirsText}
            placeholder="ex: Open source, Escalade, Photographie"
            onChange={e => setLoisirsText(e.target.value)} />
          <p className="text-xs text-slate-400 mt-1.5">Séparez par des virgules (optionnel)</p>
        </div>

        {/* Bottom save */}
        <div className="flex justify-end pb-8">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-60 transition-all shadow-lg shadow-blue-200">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Sauvegarder les modifications
          </button>
        </div>

      </div>
    </div>
  );
}