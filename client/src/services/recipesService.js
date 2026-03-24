import {request} from './api.js';

// ---------------------------
// EXPORTS : recettes
// ---------------------------

// Récupère les recettes publiées (option catégorie)
export function getPublishedRecipes(category = '') {
  const params = new URLSearchParams({ limit: '100' });
  if (category) params.set('category', category);
  return request(`/api/recipes?${params.toString()}`);
}

// Récupère le catalogue de recettes avec pagination / filtre / recherche
export async function getRecipesCatalog(params = {}) {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.category) query.set('category', params.category);
  if (params.q) query.set('q', params.q);

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
