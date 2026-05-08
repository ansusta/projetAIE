// src/utils/validation.js

// Email valide (format standard + domaines réalistes)
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
  if (!re.test(email)) return false;
  // Optionnel : bloquer les domaines factices
  const invalidDomains = ['example.com', 'test.fr', 'fake.org'];
  const domain = email.split('@')[1];
  return !invalidDomains.includes(domain);
};

// Mot de passe fort : min 8 caractères, 1 maj, 1 min, 1 chiffre, 1 caractère spécial
export const isStrongPassword = (pwd) => {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(pwd);
};

// Téléphone algérien : 10 chiffres commençant par 05,06,07 ou +2135/6/7 + 9 chiffres
export const isValidAlgerianPhone = (phone) => {
  const cleaned = phone.replace(/[\s-]/g, '');
  const localRegex = /^(05|06|07)\d{8}$/;
  const intlRegex = /^(\+213)(5|6|7)\d{8}$/;
  return localRegex.test(cleaned) || intlRegex.test(cleaned);
};

// Âge minimum 19 ans (date au format YYYY-MM-DD)
export const isOldEnough = (birthDateStr) => {
  if (!birthDateStr) return false;
  const birth = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 19;
};