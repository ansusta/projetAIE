// src/services/admin.service.js
import axios from 'axios';

// Change this to match your actual backend URL
const API_URL = 'http://localhost:5000/api/admin'; 

export const adminService = {
  getDashboardStats: async () => {
    // 1. Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // 2. Make the request with the token in the headers
    const response = await axios.get(`${API_URL}/stats`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  }
};