import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/responseHelper.js';

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function buildPublishedMediaCatalogHandler(mediaType, responseKey) {
  return asyncHandler(async (req, res) => {
    const page = parsePositiveInt(req.query.page, 1);
    const requestedLimit = parsePositiveInt(req.query.limit, 15);
    const limit = Math.min(Math.max(requestedLimit, 1), 50);
    const skip = (page - 1) * limit;
    const searchQuery = String(req.query.q || '').trim();

    const where = {
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
      [responseKey]: items.map((item) => ({
        id: item.id,
        tmdbId: item.tmdbId,
        slug: item.slug,
        title: item.titre,
        poster: item.posterUrl,
        year: item.annee,
        overview: item.synopsis,
        genre: item.genres.map((genreLink) => genreLink.genre?.nom).filter(Boolean).join(', '),
        creator: null,
      })),
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

export const getPublishedMoviesCatalog = buildPublishedMediaCatalogHandler('MOVIE', 'movies');
export const getPublishedSeriesCatalog = buildPublishedMediaCatalogHandler('SERIES', 'series');
