import api from './api';

export const matchService = {
  // Returns single best-matching job the candidate hasn't seen yet
  getRecommandations: async () => {
    const response = await api.get('/api/match/recommandations');
    return response.data; // { match: { offre, matchScore } } | { match: null }
  },

  // Returns all past matches sorted newest first
  // Each item: { matchId, offre, matchScore, dateCalcul, applied, ouvert }
  getHistory: async () => {
    const response = await api.get('/api/match/history');
    return response.data.history; // MatchHistoryItem[]
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