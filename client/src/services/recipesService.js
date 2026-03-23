const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function normalizeCategoryLabel(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'entree' || normalized === 'entrée') return 'Entrée';
  if (normalized === 'plat') return 'Plat';
  if (normalized === 'dessert') return 'Dessert';
  if (normalized === 'boisson') return 'Boisson';

  return String(value || '').trim();
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message || payload?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export function getPublishedRecipes() {
  return request('/api/recipes?published=true');
}

export async function getRecipesCatalog(params = {}) {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.category) query.set('category', params.category);
  if (params.q) query.set('q', params.q);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const payload = await request(`/api/recipes${suffix}`);

  if (Array.isArray(payload)) {
    const page = Number(params.page || 1);
    const limit = Number(params.limit || payload.length || 0);
    const normalizedCategory = normalizeCategoryLabel(params.category);
    const normalizedQuery = String(params.q || '').trim().toLowerCase();

    const filteredPayload = payload.filter((recipe) => {
      const recipeCategory = normalizeCategoryLabel(recipe?.category?.nom || recipe?.category);
      const matchesCategory = !normalizedCategory || recipeCategory === normalizedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        recipe?.titre,
        recipe?.category?.nom,
        recipe?.media?.titre,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

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

export function getMyRecipes() {
  return request('/api/users/me/recipes');
}
