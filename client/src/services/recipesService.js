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

// Récupère les recettes publiées (option catégorie)
export function getPublishedRecipes(category = '') {
  const params = new URLSearchParams({ limit: '100' });
  if (category) params.set('category', category);
  return request(`/recipes?${params.toString()}`);
}

// Récupère le catalogue de recettes avec pagination / filtre / recherche
export async function getRecipesCatalog(params = {}) {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.category) query.set('category', params.category);
  if (params.q) query.set('q', params.q);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const payload = await request(`/recipes${suffix}`);

  if (Array.isArray(payload)) {
    const page = Number(params.page || 1);
    const limit = Number(params.limit || payload.length || 0);
    const normalizedCategory = normalizeCategoryLabel(params.category);
    const normalizedQuery = String(params.q || '').trim().toLowerCase();

    const filteredPayload = payload.filter((recipe) => {
      const recipeCategory = normalizeCategoryLabel(recipe?.category?.nom || recipe?.category);
      const matchesCategory = !normalizedCategory || recipeCategory === normalizedCategory;
      if (!matchesCategory) return false;

      if (!normalizedQuery) return true;

      const haystack = [
        recipe?.titre,
        recipe?.category?.nom,
        recipe?.media?.titre,
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(normalizedQuery);
    });

    const totalItems = filteredPayload.length;
    const totalPages = limit > 0 ? Math.ceil(totalItems / limit) : 0;
    const startIndex = limit > 0 ? (page - 1) * limit : 0;
    const paginatedRecipes = limit > 0
      ? filteredPayload.slice(startIndex, startIndex + limit)
      : filteredPayload;

    return {
      recipes: paginatedRecipes,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && totalPages > 0,
      },
    };
  }

  return payload;
}

// Récupère les recettes de l'utilisateur connecté
export function getMyRecipes() {
  return request('/users/me/recipes');
}

// Récupère les notifications de l'utilisateur connecté
export function getMyNotifications() {
  return request('/users/me/notifications');
}
