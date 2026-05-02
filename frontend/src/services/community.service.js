import api from './api';

// ── Commentaires ──────────────────────────────────────────────────────────────

export const commentaireService = {
  /**
   * Get all visible comments for a recruiter.
   * Returns { commentaires, moyenne, total }
   */
  getForRecruteur: async (idRecruteur) => {
    const res = await api.get(`/api/commentaires/recruteur/${idRecruteur}`);
    return res.data;
  },

  /** Candidate: get their own review for a recruiter (null if none) */
  getMonAvis: async (idRecruteur) => {
    const res = await api.get(`/api/commentaires/mon-avis/${idRecruteur}`);
    return res.data;
  },

  /** Candidate: create or update their review */
  publier: async (idRecruteur, { contenu, note }) => {
    const res = await api.post(`/api/commentaires/recruteur/${idRecruteur}`, { contenu, note });
    return res.data;
  },

  /** Author or admin: delete a comment */
  supprimer: async (id) => {
    const res = await api.delete(`/api/commentaires/${id}`);
    return res.data;
  },

  /** Admin: toggle visibility of a comment */
  toggleVisibilite: async (id) => {
    const res = await api.patch(`/api/commentaires/${id}/visibilite`);
    return res.data;
  },
};

// ── Signalements ──────────────────────────────────────────────────────────────

export const signalementService = {
  /** Candidate: report a recruiter */
  signaler: async (idRecruteur, { motif, description }) => {
    const res = await api.post(`/api/signalements/recruteur/${idRecruteur}`, { motif, description });
    return res.data;
  },

  /** Candidate: check if they already reported this recruiter */
  getMonSignalement: async (idRecruteur) => {
    const res = await api.get(`/api/signalements/mon-signalement/${idRecruteur}`);
    return res.data;
  },

  /** Admin: list all signalements */
  lister: async (params = {}) => {
    const res = await api.get('/api/signalements', { params });
    return res.data; // { signalements, total, page, pages }
  },

  /** Admin: process a signalement */
  traiter: async (id, { statut, noteAdmin, banirRecruteur }) => {
    const res = await api.patch(`/api/signalements/${id}`, { statut, noteAdmin, banirRecruteur });
    return res.data;
  },
};