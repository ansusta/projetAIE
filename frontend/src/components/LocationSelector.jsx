// src/components/LocationSelector.jsx
import React, { useState } from 'react';
import { wilayas } from '../data/wilayasData';

export default function LocationSelector({ onLocationChange, initialWilaya, initialCommune }) {
  // Calcul des valeurs initiales
  const getInitialCommunes = () => {
    if (initialWilaya) {
      const wilaya = wilayas.find(w => w.id === parseInt(initialWilaya));
      return wilaya ? wilaya.communes : [];
    }
    return [];
  };
  const getInitialPostalCode = () => {
    if (initialWilaya && initialCommune) {
      const wilaya = wilayas.find(w => w.id === parseInt(initialWilaya));
      if (wilaya) {
        const commune = wilaya.communes.find(c => c.name === initialCommune);
        return commune ? commune.postalCode : '';
      }
    }
    return '';
  };

  const [selectedWilayaId, setSelectedWilayaId] = useState(initialWilaya || '');
  const [communes, setCommunes] = useState(getInitialCommunes);
  const [selectedCommune, setSelectedCommune] = useState(initialCommune || '');
  const [postalCode, setPostalCode] = useState(getInitialPostalCode);

  // Pas de useEffect du tout

  const handleWilayaChange = (e) => {
    const wilayaId = e.target.value;
    setSelectedWilayaId(wilayaId);
    if (wilayaId) {
      const wilaya = wilayas.find(w => w.id === parseInt(wilayaId));
      setCommunes(wilaya ? wilaya.communes : []);
      setSelectedCommune('');
      setPostalCode('');
      onLocationChange && onLocationChange({
        wilayaId,
        wilayaName: wilaya?.name || '',
        commune: '',
        postalCode: ''
      });
    } else {
      setCommunes([]);
      setSelectedCommune('');
      setPostalCode('');
      onLocationChange && onLocationChange(null);
    }
  };

  const handleCommuneChange = (e) => {
    const communeName = e.target.value;
    setSelectedCommune(communeName);
    if (communeName) {
      const communeObj = communes.find(c => c.name === communeName);
      const code = communeObj?.postalCode || '';
      setPostalCode(code);
      onLocationChange && onLocationChange({
        wilayaId: selectedWilayaId,
        wilayaName: wilayas.find(w => w.id === parseInt(selectedWilayaId))?.name || '',
        commune: communeName,
        postalCode: code
      });
    } else {
      setPostalCode('');
      onLocationChange && onLocationChange({
        wilayaId: selectedWilayaId,
        wilayaName: wilayas.find(w => w.id === parseInt(selectedWilayaId))?.name || '',
        commune: '',
        postalCode: ''
      });
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none text-slate-700 bg-white transition-all";

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Wilaya *</label>
        <select
          value={selectedWilayaId}
          onChange={handleWilayaChange}
          className={inputClass}
          required
        >
          <option value="">Sélectionnez une wilaya</option>
          {wilayas.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      {selectedWilayaId && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Commune *</label>
          <select
            value={selectedCommune}
            onChange={handleCommuneChange}
            className={inputClass}
            required
          >
            <option value="">Choisissez une commune</option>
            {communes.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {postalCode && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Code postal</label>
          <input
            type="text"
            value={postalCode}
            readOnly
            className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500"
          />
        </div>
      )}
    </div>
  );
}