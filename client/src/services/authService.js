import { request } from './api.js';

export function loginUser({ email, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    // correction tâche F-05
   body: { email, password },  // ✅ Objet brut, pas de JSON.stringify
  });
}

// Logout
export function logoutUser() {
  return request('/api/auth/logout', {
    method: 'POST',
  });
}

// Register (si besoin)
export function registerUser({ email, password, nom, prenom, pseudo, acceptedPolicies }) {
  return request('/api/auth/register', {
    method: 'POST',
    body: { email, password, nom, prenom, pseudo, acceptedPolicies },
  });
}

export function getUserProfile() {
  return request('/api/auth/me');
}

// Fonction qui envoie l'email à l'API pour demander une réinitialisation
export const forgotPassword = async (email) => {
  const res = await fetch('http://localhost:3000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return res.json();
};

export const resetPassword = async ({ token, password }) => {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) throw new Error('Erreur reset');
  return res.json();
};


