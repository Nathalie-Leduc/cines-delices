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
export const forgotPassword = (email) =>
  request('/api/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });

export const resetPassword = ({ token, password }) =>
  request('/api/auth/reset-password', {
    method: 'POST',
    body: { token, password },
  });

export const getMe = () =>
  request('/api/auth/me');

export const updateMe = (data) =>
  request('/api/auth/me', { method: 'PUT', body: data });

export const updateMyPassword = (data) =>
  request('/api/auth/me/password', { method: 'PUT', body: data });

export const deleteMe = () =>
  request('/api/auth/me', { method: 'DELETE' });

