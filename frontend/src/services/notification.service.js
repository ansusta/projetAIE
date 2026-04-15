import api from './api';

export const notificationService = {
  getAll: async () => {
    const response = await api.get('/api/notification');
    return response.data; // array of notifications
  },

  markAsRead: async (id) => {
    const response = await api.patch(`/api/notification/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/api/notification/read-all');
    return response.data;
  },
};