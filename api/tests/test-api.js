import assert from 'node:assert/strict';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const timestamp = Date.now();
const createdCategoryName = `Test Category ${timestamp}`;

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const payload = await parseJson(response);
  return { response, payload };
}

async function login(email, password) {
  const { response, payload } = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  assert.equal(response.status, 200, `Login failed for ${email}`);
  assert.ok(payload?.token, `Missing token for ${email}`);

  return payload.token;
}

async function run() {
  console.log(`Testing categories API on ${API_BASE_URL}`);

  const publicGet = await request('/api/categories');
  assert.equal(publicGet.response.status, 200, 'GET /api/categories should be public');
  assert.ok(Array.isArray(publicGet.payload), 'GET /api/categories should return an array');

  const unauthenticatedPost = await request('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: createdCategoryName }),
  });
  assert.equal(unauthenticatedPost.response.status, 401, 'POST /api/categories should reject missing token');

  const memberToken = await login('marie@cinesdelices.fr', 'Member1234!');
  const forbiddenPost = await request('/api/categories', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${memberToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: createdCategoryName }),
  });
  assert.equal(forbiddenPost.response.status, 403, 'POST /api/categories should reject non-admin users');

  const adminToken = await login('admin@cinesdelices.fr', 'Admin1234!');
  const createResponse = await request('/api/categories', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: createdCategoryName, color: '#123456' }),
  });
  assert.equal(createResponse.response.status, 201, 'POST /api/categories should allow admins');
  assert.equal(createResponse.payload?.name, createdCategoryName, 'Created category name mismatch');

  const categoryId = createResponse.payload?.id;
  assert.ok(categoryId, 'Created category id is missing');

  const updateResponse = await request(`/api/categories/${categoryId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: `${createdCategoryName} Updated`, color: '#654321' }),
  });
  assert.equal(updateResponse.response.status, 200, 'PATCH /api/categories/:id should allow admins');
  assert.equal(updateResponse.payload?.name, `${createdCategoryName} Updated`, 'Updated category name mismatch');

  const deleteResponse = await request(`/api/categories/${categoryId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  assert.equal(deleteResponse.response.status, 204, 'DELETE /api/categories/:id should allow admins');

  console.log('Categories API checks passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
