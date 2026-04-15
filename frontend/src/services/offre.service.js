import api from './api';

export const offreService = {
  // Public — supports filters: typeContrat, localisation, salaireMin, search, page, limit
  lister: async (params = {}) => {
    const response = await api.get('/api/offre', { params });
    return response.data; // { offres, total, page, pages }
  },

  getOne: async (id) => {
    const response = await api.get(`/api/offre/${id}`);
    return response.data;
  },
};