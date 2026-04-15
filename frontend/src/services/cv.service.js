import api from './api';

export const cvService = {
  createOrReplace: async (cvData) => {
    const response = await api.post('/api/cv', cvData);
    return response.data;
  },

  getMyCV: async () => {
    const response = await api.get('/api/cv/me');
    return response.data;
  },

  update: async (cvData) => {
    const response = await api.patch('/api/cv', cvData);
    return response.data;
  },

  delete: async () => {
    const response = await api.delete('/api/cv');
    return response.data;
  },

  getPublicCV: async (candidatId) => {
    const response = await api.get(`/api/cv/${candidatId}`);
    return response.data;
  },
};