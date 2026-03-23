const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || `${API_BASE_URL}/api/admin`;

async function request(path, options = {}) {
  const token = localStorage.getItem('token'); // récupération du token

  const response = await fetch(`${ADMIN_API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
       ...(token ? { 'Authorization': `Bearer ${token}` } : {}), // ajout du token si présent
    },
    ...options,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;

    try {
      const payload = await response.json();
      message = payload?.message || message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function getAdminRecipes(params = {}) {
  const query = new URLSearchParams();

  if (params.search) query.set('search', params.search);
  if (params.category && params.category !== 'Tous') query.set('category', params.category);
  if (params.status) query.set('status', params.status);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request(`/recipes${suffix}`);
}

export function getPendingRecipes() {
  return request('/recipes/pending');
}

export function deleteAdminRecipe(id) {
  return request(`/recipes/${id}`, { method: 'DELETE' });
}

export function updateAdminRecipe(id, payload) {
  return request(`/recipes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function approveAdminRecipe(id) {
  return request(`/recipes/${id}/approve`, { method: 'PATCH' });
}

export function rejectAdminRecipe(id, reason) {
  return request(`/recipes/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export function getAdminUsers(search = '') {
  const suffix = search ? `?search=${encodeURIComponent(search)}` : '';
  return request(`/users${suffix}`);
}

export function deleteAdminUser(id) {
  return request(`/users/${id}`, { method: 'DELETE' });
}

export function updateAdminUserRole(id, role) {
  return request(`/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export function getAdminCategories() {
  return request('/categories');
}

export function createAdminCategory(payload) {
  return request('/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAdminCategory(id, payload) {
  return request(`/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteAdminCategory(id) {
  return request(`/categories/${id}`, { method: 'DELETE' });
}

export function getAdminIngredients(search = '') {
  const suffix = search ? `?search=${encodeURIComponent(search)}` : '';
  return request(`/ingredients${suffix}`);
}

export function updateAdminIngredient(id, payload) {
  return request(`/ingredients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function approveAdminIngredient(id) {
  return request(`/ingredients/${id}/approve`, {
    method: 'PATCH',
  });
}

export function deleteAdminIngredient(id) {
  return request(`/ingredients/${id}`, { method: 'DELETE' });
}
