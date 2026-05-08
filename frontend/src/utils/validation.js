// src/utils/validation.js

// Liste des domaines email autorisés
const ALLOWED_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.fr',
  'hotmail.com',
  'hotmail.fr',
  'outlook.com',
  'outlook.fr',
  'live.com',
  'live.fr',
  'icloud.com',
  'protonmail.com',
  'proton.me',
  'mail.com',
  'orange.fr',
  'sfr.fr',
  'free.fr',
  'laposte.net'
];

// Email valide : format standard + domaine autorisé
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  const re = /^[^\s@]+@([^\s@]+)$/;
  const match = trimmed.match(re);
  if (!match) return false;
  const domain = match[1];
  return ALLOWED_DOMAINS.includes(domain);
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