import {request} from './api.js';

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

// Met à jour une recette de l'utilisateur connecté
export function updateMyRecipe(recipeId, data) {
  return request(`/api/recipes/${recipeId}`, {
    method: 'PATCH',
    body: data,
  });
}

// Supprime une recette de l'utilisateur connecté (persisté en base)
export function deleteMyRecipe(recipeId) {
  return request(`/api/recipes/${recipeId}`, { method: 'DELETE' });
}

// Récupère les notifications de l'utilisateur connecté
export function getMyNotifications() {
  return request('/api/users/me/notifications');
}
