import {request} from './api.js';

// 🔹 Normalise les noms de catégories pour cohérence
function normalizeCategoryLabel(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'entree' || normalized === 'entrée') return 'Entrée';
  if (normalized === 'plat') return 'Plat';
  if (normalized === 'dessert') return 'Dessert';
  if (normalized === 'boisson') return 'Boisson';

  return String(value || '').trim();
}

// ---------------------------
// EXPORTS : recettes
// ---------------------------

export function getPublishedRecipes() {
  return request('/api/recipes'); // ← enlever ?published=true (inutile, le back filtre déjà)
}

 // Render : correction pour accepter et transmettre les paramètres
export async function getRecipesCatalog(params = {}) {
  const query = new URLSearchParams();
  if (params.page)     query.set('page', params.page);
  if (params.limit)    query.set('limit', params.limit);
  if (params.category) query.set('category', params.category);
  if (params.q)        query.set('q', params.q);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request(`/api/recipes${suffix}`);
}

// Récupère les recettes de l'utilisateur connecté
export function getMyRecipes() {
  return request('/api/users/me/recipes');
}

// Récupère les notifications de l'utilisateur connecté
export function getMyNotifications() {
  return request('/api/users/me/notifications');
}
