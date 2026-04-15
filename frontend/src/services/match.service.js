import api from './api';

export const matchService = {
  // Returns single best-matching job the candidate hasn't seen yet
  getRecommandations: async () => {
    const response = await api.get('/api/match/recommandations');
    return response.data; // { match: { offre, matchScore } } | { match: null }
  },

  getScore: async (offreId) => {
    const response = await api.get(`/api/match/score/${offreId}`);
    return response.data; // { matchScore, offreId, updatedAt }
  },

  // Apply to a job through the AI matching flow
  apply: async (offreId) => {
    const response = await api.post(`/api/match/apply/${offreId}`);
    return response.data; // { message, candidature, matchScore }
  },
};