import api from './api';

export const candidatureService = {
  // Candidate: submit a direct (manual) application
  soumettre: async (idOffre) => {
    const response = await api.post('/api/candidature', { idOffre });
    return response.data;
  },

  // Candidate: list own applications
  mesCandidatures: async () => {
    const response = await api.get('/api/candidature/mes-candidatures');
    return response.data;
  },

  // Candidate / recruiter: get single application
  getCandidature: async (id) => {
    const response = await api.get(`/api/candidature/${id}`);
    return response.data;
  },
};