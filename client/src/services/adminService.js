// adminService.js
import { request } from './api.js'; // On importe notre fonction request centralisée qui gère fetch, headers, token, etc.

const ADMIN_API_BASE = '/api/admin';

// ---------------------------
// RECETTES
// ---------------------------

// Récupérer toutes les recettes avec possibilité de filtrer (search, catégorie, status)
export const getAdminRecipes = (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category && params.category !== 'Tous') query.set('category', params.category);
  if (params.status) query.set('status', params.status);

  return request(`${ADMIN_API_BASE}/recipes${query.toString() ? `?${query}` : ''}`);
};

// Récupère uniquement les recettes en attente de validation
export const getPendingRecipes = () =>
  request(`${ADMIN_API_BASE}/recipes/pending`);

// Supprime une recette par son ID
export const deleteAdminRecipe = (id) =>
  request(`${ADMIN_API_BASE}/recipes/${id}`, { method: 'DELETE' });

// Met à jour une recette avec un payload (objet contenant champs à modifier)
export const updateAdminRecipe = (id, payload) =>
  request(`${ADMIN_API_BASE}/recipes/${id}`, { method: 'PATCH', body: payload });

// Approuve une recette (change son status à validée)
export const approveAdminRecipe = (id) =>
  request(`${ADMIN_API_BASE}/recipes/${id}/publish`, { method: 'PATCH' });

// Rejette une recette avec un motif
export const rejectAdminRecipe = (id, reason) =>
  request(`${ADMIN_API_BASE}/recipes/${id}/reject`, { method: 'PATCH', body: { rejectionReason: reason } });

// ---------------------------
// UTILISATEURS
// ---------------------------

// Récupérer les utilisateurs avec option recherche
export const getAdminUsers = (search = '') =>
  request(`${ADMIN_API_BASE}/users${search ? `?search=${encodeURIComponent(search)}` : ''}`);

// Supprimer un utilisateur
export const deleteAdminUser = (id) =>
  request(`${ADMIN_API_BASE}/users/${id}`, { method: 'DELETE' });

// Changer le rôle d'un utilisateur
export const updateAdminUserRole = (id, role) =>
  request(`${ADMIN_API_BASE}/users/${id}/role`, { method: 'PATCH', body: { role } });

// Récupère les notifications admin
export const getAdminNotifications = (limit) =>
  request(`${ADMIN_API_BASE}/notifications${limit ? `?limit=${encodeURIComponent(limit)}` : ''}`);

export const deleteAdminNotification = (id) =>
  request(`${ADMIN_API_BASE}/notifications/${id}`, { method: 'DELETE' });

// ---------------------------
// CATEGORIES
// ---------------------------

// Récupérer toutes les catégories
export const getAdminCategories = () => request(`${ADMIN_API_BASE}/categories`);

export const getAdminCategoryRecipes = (id) =>
  request(`${ADMIN_API_BASE}/categories/${id}/recipes`);

// Créer une nouvelle catégorie
export const createAdminCategory = (payload) =>
  request(`${ADMIN_API_BASE}/categories`, { method: 'POST', body: payload });

// Mettre à jour une catégorie
export const updateAdminCategory = (id, payload) =>
  request(`${ADMIN_API_BASE}/categories/${id}`, { method: 'PATCH', body: payload });

// Supprimer une catégorie
export const deleteAdminCategory = (id) =>
  request(`${ADMIN_API_BASE}/categories/${id}`, { method: 'DELETE' });

// ---------------------------
// INGREDIENTS
// ---------------------------

// Récupérer les ingrédients avec option recherche
export const getAdminIngredients = (search = '') =>
  request(`${ADMIN_API_BASE}/ingredients${search ? `?search=${encodeURIComponent(search)}` : ''}`);

// Récupérer les ingrédients déjà validés
export const getValidatedAdminIngredients = (search = '') =>
  request(`${ADMIN_API_BASE}/ingredients/validated${search ? `?search=${encodeURIComponent(search)}` : ''}`);

export const getAdminIngredientRecipes = (id) =>
  request(`${ADMIN_API_BASE}/ingredients/${id}/recipes`);

// Crée un ingrédient directement approuvé (admin uniquement).
export const createAdminIngredient = (name) =>
  request(`${ADMIN_API_BASE}/ingredients`, { method: 'POST', body: { name } });

// Mettre à jour un ingrédient
export const updateAdminIngredient = (id, payload) =>
  request(`${ADMIN_API_BASE}/ingredients/${id}`, { method: 'PATCH', body: payload });

// Approuver un ingrédient
export const approveAdminIngredient = (id) => {
  // On renvoie la promesse pour pouvoir faire un await ou .then() côté appel
  return request(`${ADMIN_API_BASE}/ingredients/${id}/approve`, { method: 'PATCH' });
};

// Le motif de refus est transmis en body pour notifier le membre.
export const deleteAdminIngredient = (id, rejectionReason = '') =>
  request(`${ADMIN_API_BASE}/ingredients/${id}`, {
    method: 'DELETE',
    body: rejectionReason ? { rejectionReason } : undefined,
  });

// ─────────────────────────────────────────────────────────────
// mergeAdminIngredients — fusionne deux ingrédients en un seul
//
// Problème résolu : "citrons" (doublon) coexiste avec "citron"
// (validé, 12 recettes). On veut rattacher toutes les recettes
// de "citrons" vers "citron", puis supprimer "citrons".
//
// Paramètres :
//   sourceId  — l'ingrédient à absorber (ex: "citrons", le doublon)
//   targetId  — l'ingrédient cible qui survit (ex: "citron")
//
// Côté back : route POST /api/admin/ingredients/merge
//   → reattache tous les recipeIngredient de source vers target
//   → supprime source
//   → retourne target mis à jour
//
// Analogie : on recolle toutes les étiquettes "citrons" sur
// les bocaux "citron", puis on jette le bocal vide "citrons".
// ─────────────────────────────────────────────────────────────
export const mergeAdminIngredients = (sourceId, targetId) =>
  request(`${ADMIN_API_BASE}/ingredients/merge`, {
    method: 'POST',
    body: { sourceId, targetId },
  });

  export const getAdminUserRecipes = (userId) =>
  request(`/api/admin/users/${userId}/recipes`);
