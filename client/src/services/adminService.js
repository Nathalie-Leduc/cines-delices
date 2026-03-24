// adminService.js
import { request } from './api.js'; // On importe notre fonction request centralisée qui gère fetch, headers, token, etc.

// Récupération de l'URL de l'API admin depuis les variables d'environnement
const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || `${import.meta.env.VITE_API_URL}/api/admin`;

// ---------------------------
// RECETTES
// ---------------------------

// Récupérer toutes les recettes avec possibilité de filtrer (search, catégorie, status)
export const getAdminRecipes = (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category && params.category !== 'Tous') query.set('category', params.category);
  if (params.status) query.set('status', params.status);

  // GET avec token pour auth
  return request(
    `/recipes${query.toString() ? `?${query}` : ''}`,
    {},
    true,
    ADMIN_API_URL
  );
};

// Récupère uniquement les recettes en attente de validation
export const getPendingRecipes = () =>
  request('/recipes/pending', {}, true, ADMIN_API_URL);

// Supprime une recette par son ID
export const deleteAdminRecipe = (id) =>
  request(`/recipes/${id}`, { method: 'DELETE' }, true, ADMIN_API_URL);

// Met à jour une recette avec un payload (objet contenant champs à modifier)
export const updateAdminRecipe = (id, payload) =>
  request(`/recipes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, true, ADMIN_API_URL);

// Approuve une recette (change son status à validée)
export const approveAdminRecipe = (id) =>
  request(`/recipes/${id}/approve`, { method: 'PATCH' }, true, ADMIN_API_URL);

// Rejette une recette avec un motif
export const rejectAdminRecipe = (id, reason) =>
  request(`/recipes/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }, true, ADMIN_API_URL);

// ---------------------------
// UTILISATEURS
// ---------------------------

// Récupérer les utilisateurs avec option recherche
export const getAdminUsers = (search = '') =>
  request(`/users${search ? `?search=${encodeURIComponent(search)}` : ''}`, {}, true, ADMIN_API_URL);

// Supprimer un utilisateur
export const deleteAdminUser = (id) =>
  request(`/users/${id}`, { method: 'DELETE' }, true, ADMIN_API_URL);

// Changer le rôle d'un utilisateur
export const updateAdminUserRole = (id, role) =>
  request(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }, true, ADMIN_API_URL);

// Récupère les notifications admin
export const getAdminNotifications = () =>
  request('/notifications', {}, true, ADMIN_API_URL);

// ---------------------------
// CATEGORIES
// ---------------------------

// Récupérer toutes les catégories
export const getAdminCategories = () => request('/categories', {}, true, ADMIN_API_URL);

// Créer une nouvelle catégorie
export const createAdminCategory = (payload) =>
  request('/categories', { method: 'POST', body: JSON.stringify(payload) }, true, ADMIN_API_URL);

// Mettre à jour une catégorie
export const updateAdminCategory = (id, payload) =>
  request(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, true, ADMIN_API_URL);

// Supprimer une catégorie
export const deleteAdminCategory = (id) =>
  request(`/categories/${id}`, { method: 'DELETE' }, true, ADMIN_API_URL);

// ---------------------------
// INGREDIENTS
// ---------------------------

// Récupérer les ingrédients avec option recherche
export const getAdminIngredients = (search = '') =>
  request(`/ingredients${search ? `?search=${encodeURIComponent(search)}` : ''}`, {}, true, ADMIN_API_URL);

// Mettre à jour un ingrédient
export const updateAdminIngredient = (id, payload) =>
  request(`/ingredients/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, true, ADMIN_API_URL);

// Approuver un ingrédient
export const approveAdminIngredient = (id) => {
   // On renvoie la promesse pour pouvoir faire un await ou .then() côté appel
  return request(`/ingredients/${id}/approve`, { method: 'PATCH' }, true, ADMIN_API_URL);
};

// Supprimer un ingrédient par son ID
export const deleteAdminIngredient = (id) =>
  request(`/ingredients/${id}`, { method: 'DELETE' }, true, ADMIN_API_URL);





