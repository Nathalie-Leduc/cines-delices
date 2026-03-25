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
export function registerUser({ email, password, nom, prenom, pseudo }) {
  return request('/api/auth/register', {
    method: 'POST',
    body: { email, password, nom, prenom, pseudo },
  });
}

export function getUserProfile() {
  return request('/api/auth/me');
}
