import { request } from './api.js';

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function buildPagination(totalItems, page, limit) {
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 0;

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

function paginateItems(items, params = {}, responseKey) {
  const query = String(params.q || '').trim().toLowerCase();
  const page = parsePositiveInt(params.page, 1);
  const limit = parsePositiveInt(params.limit, 15);
  const filteredItems = query
    ? items.filter((item) => String(item?.title || '').toLowerCase().includes(query))
    : items;
  const startIndex = (page - 1) * limit;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + limit);

  return {
    [responseKey]: paginatedItems,
    pagination: buildPagination(filteredItems.length, page, limit),
  };
}

function buildCatalogPayload(payload, params, responseKey) {
  if (Array.isArray(payload)) {
    return paginateItems(payload, params, responseKey);
  }

  const items = Array.isArray(payload?.[responseKey]) ? payload[responseKey] : [];
  const paginationPayload = payload?.pagination || {};
  const page = parsePositiveInt(paginationPayload.page, parsePositiveInt(params.page, 1));
  const limit = parsePositiveInt(paginationPayload.limit, parsePositiveInt(params.limit, 15));
  const totalItems = parsePositiveInt(paginationPayload.totalItems, items.length);

  return {
    [responseKey]: items,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: parsePositiveInt(paginationPayload.totalPages, totalItems > 0 ? Math.ceil(totalItems / limit) : 0),
      hasNextPage: Boolean(paginationPayload.hasNextPage),
      hasPreviousPage: Boolean(paginationPayload.hasPreviousPage),
    },
  };
}

function buildMediaCatalogRequest(pathname, params = {}) {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.q) query.set('q', params.q);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request(`${pathname}${suffix}`);
}

function buildMediaDetailPath(pathname, slug) {
  const normalizedSlug = String(slug || '').trim();
  return request(`${pathname}/${encodeURIComponent(normalizedSlug)}`);
}

export async function fetchMedia(type, search = '') {
  try {
    if (search) {
      return await request(`/api/tmdb/medias/search?searchTerm=${encodeURIComponent(search)}`);
    }

    return await request(type ? `/api/tmdb/medias/${type}` : '/api/tmdb/medias');
  } catch (error) {
    if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
      console.error('fetchMedia failed:', error);
    }
  }

  return [];
}

export async function getMoviesCatalog(params = {}) {
  const payload = await buildMediaCatalogRequest('/api/media/movies', params);
  return buildCatalogPayload(payload, params, 'movies');
}

export async function getSeriesCatalog(params = {}) {
  const payload = await buildMediaCatalogRequest('/api/media/series', params);
  return buildCatalogPayload(payload, params, 'series');
}

export function getMovieBySlug(slug) {
  return buildMediaDetailPath('/api/media/movies', slug);
}

export function getSeriesBySlug(slug) {
  return buildMediaDetailPath('/api/media/series', slug);
}
