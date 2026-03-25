import assert from 'node:assert/strict';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const timestamp = Date.now();
const createdCategoryName = `Test Category ${timestamp}`;
const createdUserEmail = `integration-admin-${timestamp}@cinesdelices.fr`;

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

function authHeaders(token, includeJson = false) {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
  };
}

async function registerUser() {
  const { response, payload } = await request('/api/auth/register', {
    method: 'POST',
    headers: authHeaders(null, true),
    body: JSON.stringify({
      email: createdUserEmail,
      nom: 'Integration',
      prenom: 'Admin',
      password: 'Test1234!',
    }),
  });

  assert.equal(response.status, 201, 'Registering the integration user should succeed');
  assert.ok(payload?.user?.id, 'Registered integration user should expose an id');

  return payload.user;
}

async function deleteUserAsAdmin(adminToken, userId) {
  if (!userId) {
    return;
  }

  await request(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(adminToken),
  });
}

async function run() {
  console.log(`Testing admin and categories API on ${API_BASE_URL}`);

  const memberToken = await login('marie@cinesdelices.fr', 'Member1234!');
  const adminToken = await login('admin@cinesdelices.fr', 'Admin1234!');

  const adminUsersResponse = await request('/api/admin/users', {
    headers: authHeaders(adminToken),
  });
  assert.equal(adminUsersResponse.response.status, 200, 'GET /api/admin/users should allow admins');
  assert.ok(Array.isArray(adminUsersResponse.payload), 'GET /api/admin/users should return an array');

  const unauthenticatedAdminUsers = await request('/api/admin/users');
  assert.equal(unauthenticatedAdminUsers.response.status, 401, 'GET /api/admin/users should reject missing token');

  const forbiddenAdminUsers = await request('/api/admin/users', {
    headers: authHeaders(memberToken),
  });
  assert.equal(forbiddenAdminUsers.response.status, 403, 'GET /api/admin/users should reject members');

  const createdUser = await registerUser();

  try {
    const unauthenticatedPromote = await request(`/api/admin/users/${createdUser.id}/role`, {
      method: 'PATCH',
      headers: authHeaders(null, true),
      body: JSON.stringify({ role: 'ADMIN' }),
    });
    assert.equal(
      unauthenticatedPromote.response.status,
      401,
      'PATCH /api/admin/users/:id/role should reject missing token',
    );

    const forbiddenPromote = await request(`/api/admin/users/${createdUser.id}/role`, {
      method: 'PATCH',
      headers: authHeaders(memberToken, true),
      body: JSON.stringify({ role: 'ADMIN' }),
    });
    assert.equal(
      forbiddenPromote.response.status,
      403,
      'PATCH /api/admin/users/:id/role should reject members',
    );

    const promoteResponse = await request(`/api/admin/users/${createdUser.id}/role`, {
      method: 'PATCH',
      headers: authHeaders(adminToken, true),
      body: JSON.stringify({ role: 'ADMIN' }),
    });
    assert.equal(promoteResponse.response.status, 200, 'PATCH /api/admin/users/:id/role should allow admins');
    assert.equal(promoteResponse.payload?.id, createdUser.id, 'Updated user id should match');
    assert.equal(promoteResponse.payload?.role, 'ADMIN', 'Updated user role should be ADMIN');

    const usersAfterPromotion = await request('/api/admin/users', {
      headers: authHeaders(adminToken),
    });
    assert.equal(usersAfterPromotion.response.status, 200, 'GET /api/admin/users should still succeed after role update');
    assert.equal(
      usersAfterPromotion.payload?.find((user) => user.id === createdUser.id)?.role,
      'ADMIN',
      'Updated role should be visible in the admin users list',
    );
  } finally {
    await deleteUserAsAdmin(adminToken, createdUser.id);
  }

  const publicGet = await request('/api/categories');
  assert.equal(publicGet.response.status, 200, 'GET /api/categories should be public');
  assert.ok(Array.isArray(publicGet.payload), 'GET /api/categories should return an array');

  const unauthenticatedAdminCategories = await request('/api/admin/categories');
  assert.equal(
    unauthenticatedAdminCategories.response.status,
    401,
    'GET /api/admin/categories should reject missing token',
  );

  const forbiddenAdminCategories = await request('/api/admin/categories', {
    headers: authHeaders(memberToken),
  });
  assert.equal(
    forbiddenAdminCategories.response.status,
    403,
    'GET /api/admin/categories should reject members',
  );

  const adminCategories = await request('/api/admin/categories', {
    headers: authHeaders(adminToken),
  });
  assert.equal(adminCategories.response.status, 200, 'GET /api/admin/categories should allow admins');
  assert.ok(Array.isArray(adminCategories.payload), 'GET /api/admin/categories should return an array');

  const unauthenticatedPost = await request('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: createdCategoryName }),
  });
  assert.equal(unauthenticatedPost.response.status, 401, 'POST /api/categories should reject missing token');

  const forbiddenPost = await request('/api/categories', {
    method: 'POST',
    headers: authHeaders(memberToken, true),
    body: JSON.stringify({ name: createdCategoryName }),
  });
  assert.equal(forbiddenPost.response.status, 403, 'POST /api/categories should reject non-admin users');

  const createResponse = await request('/api/categories', {
    method: 'POST',
    headers: authHeaders(adminToken, true),
    body: JSON.stringify({ name: createdCategoryName, color: '#123456' }),
  });
  assert.equal(createResponse.response.status, 201, 'POST /api/categories should allow admins');
  assert.equal(createResponse.payload?.name, createdCategoryName, 'Created category name mismatch');

  const categoryId = createResponse.payload?.id;
  assert.ok(categoryId, 'Created category id is missing');

  const updateResponse = await request(`/api/categories/${categoryId}`, {
    method: 'PATCH',
    headers: authHeaders(adminToken, true),
    body: JSON.stringify({ name: `${createdCategoryName} Updated`, color: '#654321' }),
  });
  assert.equal(updateResponse.response.status, 200, 'PATCH /api/categories/:id should allow admins');
  assert.equal(updateResponse.payload?.name, `${createdCategoryName} Updated`, 'Updated category name mismatch');

  const deleteResponse = await request(`/api/categories/${categoryId}`, {
    method: 'DELETE',
    headers: authHeaders(adminToken),
  });
  assert.equal(deleteResponse.response.status, 204, 'DELETE /api/categories/:id should allow admins');

  console.log('Admin users and categories API checks passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
