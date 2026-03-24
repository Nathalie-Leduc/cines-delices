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

function paginateMovies(items, params = {}) {
  const query = String(params.q || '').trim().toLowerCase();
  const page = parsePositiveInt(params.page, 1);
  const limit = parsePositiveInt(params.limit, 15);
  const filteredItems = query
    ? items.filter((item) => String(item?.title || '').toLowerCase().includes(query))
    : items;
  const startIndex = (page - 1) * limit;
  const movies = filteredItems.slice(startIndex, startIndex + limit);

  return {
    movies,
    pagination: buildPagination(filteredItems.length, page, limit),
  };
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
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.q) query.set('q', params.q);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const payload = await request(`/api/media/movies${suffix}`);

  if (Array.isArray(payload)) {
    return paginateMovies(payload, params);
  }

  const movies = Array.isArray(payload?.movies) ? payload.movies : [];
  const paginationPayload = payload?.pagination || {};
  const page = parsePositiveInt(paginationPayload.page, parsePositiveInt(params.page, 1));
  const limit = parsePositiveInt(paginationPayload.limit, parsePositiveInt(params.limit, 15));
  const totalItems = parsePositiveInt(paginationPayload.totalItems, movies.length);

  return {
    movies,
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
