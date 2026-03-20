const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || `${API_BASE_URL}/api/auth`;

async function request(path, options = {}) {
  const response = await fetch(`${AUTH_API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error || payload?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export function loginUser({ email, password }) {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}
