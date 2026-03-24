import dotenv from 'dotenv';
import { mapMedia } from '../mappers/mediaMapper.js';

dotenv.config();

const TMDB_PAGE_SIZE = 20;

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function buildTmdbUrl(pathname, params = {}) {
  const searchParams = new URLSearchParams({
    api_key: process.env.TMDB_API_KEY,
    language: 'fr-FR',
  });

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  return `${process.env.TMDB_BASE_URL}${pathname}?${searchParams.toString()}`;
}

async function fetchTmdb(pathname, params = {}) {
  const response = await fetch(buildTmdbUrl(pathname, params));

  if (!response.ok) {
    throw new Error(`Erreur TMDB ${pathname}`);
  }

  return response.json();
}

async function fetchByType(type) {
  const data = await fetchTmdb(`/discover/${type}`);
  return data.results.map((item) => mapMedia(item, type));
}

async function fetchMovieDirector(movieId) {
  const creditsData = await fetchTmdb(`/movie/${movieId}/credits`);
  const director = creditsData.crew?.find((person) => person.job === 'Director');
  return director?.name ?? null;
}

async function fetchMovieGenreMap() {
  const data = await fetchTmdb('/genre/movie/list');
  return new Map((data.genres || []).map((genre) => [genre.id, genre.name]));
}

function resolveMovieGenre(item, genreMap) {
  if (Array.isArray(item.genres) && item.genres.length > 0) {
    return item.genres.map((genre) => genre?.name).filter(Boolean).join(', ');
  }

  if (Array.isArray(item.genre_ids) && item.genre_ids.length > 0) {
    return item.genre_ids
      .map((genreId) => genreMap.get(genreId))
      .filter(Boolean)
      .slice(0, 2)
      .join(', ');
  }

  return null;
}

async function enrichMovieResults(items) {
  if (!items.length) {
    return [];
  }

  const genreMap = await fetchMovieGenreMap();
  const directors = await Promise.all(
    items.map(async (item) => {
      try {
        return await fetchMovieDirector(item.id);
      } catch {
        return null;
      }
    })
  );

  return items.map((item, index) => mapMedia(item, 'movie', {
    director: directors[index],
    genre: resolveMovieGenre(item, genreMap),
  }));
}

async function fetchMovieCatalogWindow({ query, page, limit }) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit - 1;
  const firstTmdbPage = Math.floor(startIndex / TMDB_PAGE_SIZE) + 1;
  const lastTmdbPage = Math.floor(endIndex / TMDB_PAGE_SIZE) + 1;
  const endpoint = query ? '/search/movie' : '/discover/movie';

  const rawPages = await Promise.all(
    Array.from({ length: lastTmdbPage - firstTmdbPage + 1 }, (_, offset) => {
      const tmdbPage = firstTmdbPage + offset;
      return fetchTmdb(endpoint, {
        page: tmdbPage,
        query,
      });
    })
  );

  const totalItems = Number(rawPages[0]?.total_results || 0);
  const combinedResults = rawPages.flatMap((payload) => payload.results || []);
  const sliceStart = startIndex - (firstTmdbPage - 1) * TMDB_PAGE_SIZE;
  const pagedItems = combinedResults.slice(sliceStart, sliceStart + limit);
  const movies = await enrichMovieResults(pagedItems);

  return {
    movies,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: totalItems > 0 ? Math.ceil(totalItems / limit) : 0,
      hasNextPage: startIndex + limit < totalItems,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getAllMedias(req, res) {
  try {
    const type = req.params.type;
    const query = String(req.query.q || req.query.searchTerm || '').trim();
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 15);
    const shouldReturnCatalog = type === 'movie' && ('page' in req.query || 'limit' in req.query || query);

    if (shouldReturnCatalog) {
      const payload = await fetchMovieCatalogWindow({ query, page, limit });
      return res.json(payload);
    }

    let results;

    if (type === 'movie' || type === 'tv') {
      results = await fetchByType(type);
    } else {
      const [movies, tv] = await Promise.all([fetchByType('movie'), fetchByType('tv')]);
      results = [...movies, ...tv];
    }

    return res.json(results);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération des médias' });
  }
}

export async function getMediaById(req, res) {
  try {
    const { type = 'movie', id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'ID requis' });
    }

    const data = await fetchTmdb(`/${type}/${id}`);
    let director = null;

    if (type === 'movie') {
      try {
        director = await fetchMovieDirector(id);
      } catch {
        director = null;
      }
    }

    return res.json(mapMedia(data, type, { director }));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération du média' });
  }
}

export async function searchMedia(req, res) {
  try {
    const searchTerm = String(req.query.searchTerm || req.query.q || '').trim();
    const mediaType = String(req.query.type || '').trim();

    if (!searchTerm) {
      return res.status(400).json({ message: "Paramètre 'searchTerm' requis" });
    }

    const endpoint = mediaType === 'movie' ? '/search/movie' : mediaType === 'tv' ? '/search/tv' : '/search/multi';
    const data = await fetchTmdb(endpoint, { query: searchTerm });

    let results = data.results || [];

    if (!mediaType) {
      results = results.filter((item) => item.media_type === 'movie' || item.media_type === 'tv');
    }

    if (mediaType === 'movie') {
      return res.json(await enrichMovieResults(results));
    }

    return res.json(results.map((item) => mapMedia(item, item.media_type || mediaType)));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur lors de la recherche de média' });
  }
}
