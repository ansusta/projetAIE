import api from './api';

export const authService = {
  login: async (credentials) => {
    const payload = {
      email: credentials.email,
      motDePasse: credentials.password 
    };
    const response = await api.post('/api/auth/login', payload);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
// Add this new function to auth.service.js
// Replace the previous updateProfile with this one in auth.service.js
  updateProfile: async (userData) => {
    // Because of multer, we MUST send a FormData object, not standard JSON
    const formData = new FormData();
    
    // Append standard fields
    if (userData.prenom) formData.append('prenom', userData.prenom);
    if (userData.nom) formData.append('nom', userData.nom);
    if (userData.telephone) formData.append('telephone', userData.telephone);
    
    // Express/Multer typically parses nested objects via bracket notation
    if (userData.adresse) {
      if (userData.adresse.numeroRue) formData.append('adresse[numeroRue]', userData.adresse.numeroRue);
      if (userData.adresse.nomRue) formData.append('adresse[nomRue]', userData.adresse.nomRue);
      if (userData.adresse.codePostal) formData.append('adresse[codePostal]', userData.adresse.codePostal);
      if (userData.adresse.ville) formData.append('adresse[ville]', userData.adresse.ville);
    }

    // Append the file if the user uploaded one
    if (userData.photoProfil) {
      formData.append('photoProfil', userData.photoProfil);
    }

    // Pass formData directly. Axios will automatically set the 'multipart/form-data' header.
    const response = await api.put('/api/auth/update-profile', formData);
    
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  registerCandidate: async (data) => {
    const payload = {
      email: data.email,
      motDePasse: data.password,
      telephone: data.phone,
      nom: data.lastName,
      prenom: data.firstName,
      dateNaissance: data.birthDate,
      // Nested object mapping exactly to your Mongoose schema
      adresse: {
        numeroRue: data.streetNumber,
        nomRue: data.streetName,
        complementAdrs: data.addressComplement,
        codePostal: data.zipCode,
        ville: data.city,
        region: data.region,
        pays: data.country
      }
    };
    
    const response = await api.post('/api/auth/signup/candidat', payload);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  registerRecruiter: async (data) => {
    const payload = {
      email: data.email,
      motDePasse: data.password,
      telephone: data.phone,
      nomEntreprise: data.companyName, 
      secteurActivite: data.industry,
      descriptionEntreprise: data.description,
      // Nested object mapping exactly to your Mongoose schema
      adresse: {
        numeroRue: data.streetNumber,
        nomRue: data.streetName,
        complementAdrs: data.addressComplement,
        codePostal: data.zipCode,
        ville: data.city,
        region: data.region,
        pays: data.country
      }
    };
    
    const response = await api.post('/api/auth/signup/recruteur', payload);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

// In auth.service.js, replace your logout function with this:
  logout: () => {
    // We just remove the user and token from the browser. 
    // No backend call needed since we use JWT!
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },
  // Add this inside auth.service.js
  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
  // Add these inside your auth.service.js object:
  
  updatePreferences: async (preferencesData) => {
    // Matches your router.put('/preferences') endpoint
    const response = await api.put('/api/auth/preferences', preferencesData); 
    return response.data;
  },

  changePassword: async (passwordData) => {
    // Assuming you have a route like this for passwords
    const response = await api.put('/api/auth/change-password', passwordData);
    return response.data;
  },
  
};