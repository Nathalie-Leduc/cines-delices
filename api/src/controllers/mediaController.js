import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/responseHelper.js';

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const getPublishedMoviesCatalog = asyncHandler(async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1);
  const requestedLimit = parsePositiveInt(req.query.limit, 15);
  const limit = Math.min(Math.max(requestedLimit, 1), 50);
  const skip = (page - 1) * limit;
  const searchQuery = String(req.query.q || '').trim();

  const where = {
    type: 'MOVIE',
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

  const [movies, totalItems] = await prisma.$transaction([
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
    movies: movies.map((movie) => ({
      id: movie.id,
      tmdbId: movie.tmdbId,
      slug: movie.slug,
      title: movie.titre,
      poster: movie.posterUrl,
      year: movie.annee,
      overview: movie.synopsis,
      genre: movie.genres.map((item) => item.genre?.nom).filter(Boolean).join(', '),
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
