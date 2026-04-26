/**
 * FiltresPersonnelsForm.jsx
 *
 * Drop this inside your offer create / edit form.
 *
 * Props:
 *   value    : { ageMin, ageMax, genres[] }
 *   onChange : (newFiltres) => void
 *
 * Example usage:
 *   const [filtres, setFiltres] = useState({ ageMin: null, ageMax: null, genres: [] })
 *   <FiltresPersonnelsForm value={filtres} onChange={setFiltres} />
 *   // then include `filtresPersonnels: filtres` in your POST /api/offres body
 */

import React from 'react';
import { Users, Calendar, Info } from 'lucide-react';

const GENRE_OPTIONS = [
  { value: 'homme',       label: 'Hommes'   },
  { value: 'femme',       label: 'Femmes'   },
  { value: 'autre',       label: 'Autres'   },
  { value: 'nonSpecifie', label: 'Non précisé' },
];

export default function FiltresPersonnelsForm({ value = {}, onChange }) {
  const filtres = {
    ageMin : value.ageMin  || '',
    ageMax : value.ageMax  || '',
    genres : value.genres  || [],
  };

  const update = (patch) => onChange({ ...filtres, ...patch });

  const toggleGenre = (g) => {
    const next = filtres.genres.includes(g)
      ? filtres.genres.filter(x => x !== g)
      : [...filtres.genres, g];
    update({ genres: next });
  };

  const inp = 'w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:outline-none text-slate-700 bg-white';

  const hasAnyFilter = filtres.ageMin || filtres.ageMax || filtres.genres.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Filtres personnels
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Optionnel — restreint les candidats qui voient cette offre dans leur matching IA.
          </p>
        </div>
        {hasAnyFilter && (
          <button
            type="button"
            onClick={() => onChange({ ageMin: null, ageMax: null, genres: [] })}
            className="text-xs text-red-500 hover:underline font-medium"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Age range */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-slate-400" />
          Tranche d'âge
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="number"
              placeholder="Âge min"
              min={16} max={99}
              className={inp}
              value={filtres.ageMin}
              onChange={e => update({ ageMin: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
          <span className="text-slate-400 font-medium shrink-0">→</span>
          <div className="flex-1">
            <input
              type="number"
              placeholder="Âge max"
              min={16} max={99}
              className={inp}
              value={filtres.ageMax}
              onChange={e => update({ ageMax: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
        </div>
        {filtres.ageMin && filtres.ageMax && Number(filtres.ageMin) > Number(filtres.ageMax) && (
          <p className="text-xs text-red-500 mt-1.5">L'âge minimum ne peut pas dépasser l'âge maximum.</p>
        )}
        {/* Common presets */}
        <div className="flex gap-2 mt-2 flex-wrap">
          {[
            { label: '+18',      min: 18,  max: null },
            { label: '+25',      min: 25,  max: null },
            { label: '18–35',    min: 18,  max: 35   },
            { label: '25–45',    min: 25,  max: 45   },
          ].map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => update({ ageMin: p.min, ageMax: p.max })}
              className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all ${
                filtres.ageMin === p.min && filtres.ageMax === p.max
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-slate-400" />
          Genre
          <span className="text-xs font-normal text-slate-400">(aucune sélection = tous les genres)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {GENRE_OPTIONS.map(opt => {
            const active = filtres.genres.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleGenre(opt.value)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                  active
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {active && <span className="mr-1">✓</span>}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary badge */}
      {hasAnyFilter && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Cette offre sera filtrée pour :
            {filtres.ageMin && ` âge ≥ ${filtres.ageMin}`}
            {filtres.ageMin && filtres.ageMax && ','}
            {filtres.ageMax && ` âge ≤ ${filtres.ageMax}`}
            {(filtres.ageMin || filtres.ageMax) && filtres.genres.length > 0 && ' ·'}
            {filtres.genres.length > 0 && ` genre : ${filtres.genres.join(', ')}`}.
            {' '}Les candidats hors critères ne recevront pas cette offre en recommandation.
          </span>
        </div>
      )}
    </div>
  );
}