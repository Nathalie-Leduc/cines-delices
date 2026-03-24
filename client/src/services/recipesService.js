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

export function getMyRecipes() {
  return request('/api/users/me/recipes');
}
