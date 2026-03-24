import { request } from './api.js';

export function loginUser({ email, password }) {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  },true);  // true = utilise AUTH_API_URL
}

// Logout
export function logoutUser() {
  return request('/logout', {
    method: 'POST',
  }, true);
}

// Register (si besoin)
export function registerUser({ email, password, name }) {
  return request('/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  }, true);
}

// Exemple pour récupérer le profil de l'utilisateur connecté
export function getUserProfile() {
  return request('/me', {}, true);
}
