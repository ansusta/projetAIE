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

  updateProfile: async (userData) => {
    const formData = new FormData();

    // Text fields — only append when defined (empty string is a valid update)
    const textFields = ['prenom', 'nom', 'telephone', 'bio', 'genre', 'dateNaissance'];
    textFields.forEach(f => {
      if (userData[f] !== undefined && userData[f] !== null) {
        formData.append(f, userData[f]);
      }
    });

    // Nested address
    if (userData.adresse) {
      const addr = userData.adresse;
      if (addr.numeroRue  !== undefined) formData.append('adresse[numeroRue]',  addr.numeroRue);
      if (addr.nomRue     !== undefined) formData.append('adresse[nomRue]',     addr.nomRue);
      if (addr.codePostal !== undefined) formData.append('adresse[codePostal]', addr.codePostal);
      if (addr.ville      !== undefined) formData.append('adresse[ville]',      addr.ville);
      if (addr.region     !== undefined) formData.append('adresse[region]',     addr.region);
      if (addr.pays       !== undefined) formData.append('adresse[pays]',       addr.pays);
    }

    // Photo file
    if (userData.photoProfil instanceof File) {
      formData.append('photoProfil', userData.photoProfil);
    }

    const response = await api.put('/api/auth/update-profile', formData);
    if (response.data.user) {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, ...response.data.user }));
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
      adresse: {
        numeroRue: data.streetNumber,
        nomRue: data.streetName,
        complementAdrs: data.addressComplement,
        codePostal: data.zipCode,
        ville: data.city,
        region: data.region,
        pays: data.country,
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
      adresse: {
        numeroRue: data.streetNumber,
        nomRue: data.streetName,
        complementAdrs: data.addressComplement,
        codePostal: data.zipCode,
        ville: data.city,
        region: data.region,
        pays: data.country,
      }
    };
    const response = await api.post('/api/auth/signup/recruteur', payload);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  updatePreferences: async (preferencesData) => {
    const response = await api.put('/api/auth/preferences', preferencesData);
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.put('/api/auth/change-password', passwordData);
    return response.data;
  },
  getPublicProfile: async (id) => {
    const response = await api.get(`/api/auth/users/${id}/profil`);
    return response.data;
  },
};