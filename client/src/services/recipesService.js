const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

export async function getRecipesCatalog() {
  const publishedRecipes = await getPublishedRecipes();

  if (Array.isArray(publishedRecipes) && publishedRecipes.length > 0) {
    return publishedRecipes;
  }

  return request('/api/recipes');
}

export function getMyRecipes() {
  return request('/api/users/me/recipes');
}
