import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/responseHelper.js';

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function buildPublishedMediaWhere(mediaType, searchQuery = '') {
  return {
    type: mediaType,
    recipes: {
      some: {
        status: 'PUBLISHED',
      },
    },
    ...(searchQuery ? {
      titre: {
        contains: searchQuery,
        mode: 'insensitive',
      },
    } : {}),
  };
}

function mapPublishedMediaPayload(item) {
  return {
    id: item.id,
    tmdbId: item.tmdbId,
    slug: item.slug,
    title: item.titre,
    poster: item.posterUrl,
    year: item.annee,
    overview: item.synopsis,
    genre: item.genres.map((genreLink) => genreLink.genre?.nom).filter(Boolean).join(', '),
    creator: item.realisateur,
  };
}

function buildPublishedMediaCatalogHandler(mediaType, responseKey) {
  return asyncHandler(async (req, res) => {
    const page = parsePositiveInt(req.query.page, 1);
    const requestedLimit = parsePositiveInt(req.query.limit, 15);
    const limit = Math.min(Math.max(requestedLimit, 1), 50);
    const skip = (page - 1) * limit;
    const searchQuery = String(req.query.q || '').trim();

    const where = buildPublishedMediaWhere(mediaType, searchQuery);

    const [items, totalItems] = await prisma.$transaction([
      prisma.media.findMany({
        where,
        orderBy: [
          { titre: 'asc' },
        ],
        skip,
        take: limit,
        include: {
          genres: {
            include: {
              genre: true,
            },
          },
        },
      }),
      prisma.media.count({ where }),
    ]);

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    res.json({
      [responseKey]: items.map(mapPublishedMediaPayload),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && totalPages > 0,
      },
    });
  });
}

function buildPublishedMediaDetailHandler(mediaType, responseKey, entityLabel) {
  return asyncHandler(async (req, res) => {
    const slug = String(req.params.slug || '').trim();

    const item = await prisma.media.findFirst({
      where: {
        ...buildPublishedMediaWhere(mediaType),
        slug,
      },
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
      },
    });

    if (!item) {
      return res.status(404).json({ message: `${entityLabel} introuvable.` });
    }

    return res.json({
      [responseKey]: mapPublishedMediaPayload(item),
    });
  });
}

export const getPublishedMoviesCatalog = buildPublishedMediaCatalogHandler('MOVIE', 'movies');
export const getPublishedSeriesCatalog = buildPublishedMediaCatalogHandler('SERIES', 'series');
export const getPublishedMovieBySlug = buildPublishedMediaDetailHandler('MOVIE', 'movie', 'Film');
export const getPublishedSeriesBySlug = buildPublishedMediaDetailHandler('SERIES', 'series', 'Série');
