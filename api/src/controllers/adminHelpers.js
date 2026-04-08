import { prisma } from '../lib/prisma.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { downloadAndConvertPoster } from '../lib/posterService.js';

const DEFAULT_CATEGORY_COLORS = {
  'entrée': '#84A767',
  entree: '#84A767',
  plat: '#8E1F2F',
  dessert: '#6F4D39',
  boisson: '#3A8A9A',
};

export function getCategoryColor(categoryColor, categoryName) {
  if (categoryColor) {
    return categoryColor;
  }
  const key = String(categoryName || '').trim().toLowerCase();
  return DEFAULT_CATEGORY_COLORS[key] || '#C9A45C';
}

export function normalizeNamePart(value) {
  return String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function toDisplayWords(value) {
  return String(value || '')
    .trim()
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function formatSubmitter(user) {
  if (!user) {
    return {
      firstName: 'Ancien',
      lastName: 'membre',
      fullName: 'Ancien membre',
    };
  }

  const rawPseudo = String(user?.pseudo || '').trim();
  const rawLastName = String(user?.nom || '').trim();
  const pseudoParts = rawPseudo.split(/[._-]+/).filter(Boolean);
  const normalizedLastName = normalizeNamePart(rawLastName);

  const filteredPseudoParts = normalizedLastName
    && pseudoParts.length > 1
    && normalizeNamePart(pseudoParts[pseudoParts.length - 1]) === normalizedLastName
    ? pseudoParts.slice(0, -1)
    : pseudoParts;

  const firstName = toDisplayWords(filteredPseudoParts.join(' ') || rawPseudo);
  const lastName = toDisplayWords(rawLastName);
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Membre inconnu';

  return {
    firstName,
    lastName,
    fullName,
  };
}

export function formatRecipe(recipe) {
  const duration = [recipe.tempsPreparation, recipe.tempsCuisson]
    .filter((value) => Number.isFinite(value) && value > 0)
    .reduce((sum, value) => sum + value, 0);

  const submittedBy = formatSubmitter(recipe.user);

  return {
    id: recipe.id,
    title: recipe.titre,
    slug: recipe.slug,
    category: recipe.category?.nom || 'Autre',
    categoryId: recipe.categoryId,
    movie: recipe.media?.titre || 'Sans média',
    movieId: recipe.mediaId,
    duration: `${duration || 0} min`,
    media: recipe.media?.type === 'SERIES' ? 'S' : 'F',
    image: recipe.imageURL || null,
    mediaPoster: recipe.media?.posterUrl || null,
    director: recipe.media?.realisateur || null,
    year: recipe.media?.annee || null,
    synopsis: recipe.media?.synopsis || null,
    status: recipe.status,
    instructions: recipe.instructions,
    people: recipe.nombrePersonnes || 0,
    preparationTime: recipe.tempsPreparation || 0,
    cookingTime: recipe.tempsCuisson || 0,
    rejectionReason: recipe.rejectionReason || '',
    submittedBy,
    submittedByLabel: submittedBy.fullName,
    ingredients: recipe.ingredients.map((item) => ({
      id: item.ingredient.id,
      name: item.ingredient.nom,
      quantity: item.quantity || '',
      unit: item.unit || '',
    })),
  };
}

export function formatUser(user) {
  const recipeCounts = user.recipes.reduce((accumulator, recipe) => {
    const key = String(recipe.category?.nom || '').trim();
    if (key) {
      accumulator[key] = (accumulator[key] || 0) + 1;
    }
    return accumulator;
  }, {});

  return {
    id: user.id,
    nom: user.pseudo.toUpperCase(),
    displayName: user.pseudo,
    prenom: user.pseudo,
    email: user.email,
    role: user.role,
    recipeCounts,
  };
}

export function formatCategory(category) {
  return {
    id: category.id,
    name: category.nom,
    description: category.description || '',
    color: getCategoryColor(category.color, category.nom),
    recipesCount: category._count?.recipes || 0,
  };
}

export function formatIngredient(ingredient) {
  const linkedRecipes = Array.isArray(ingredient.recipes)
    ? ingredient.recipes
        .map((relation) => relation.recipe)
        .filter(Boolean)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  const firstLinkedRecipe = linkedRecipes[0] || null;
  const submittedBy = formatSubmitter(firstLinkedRecipe?.user);

  return {
    id: ingredient.id,
    name: ingredient.nom,
    recipesCount: ingredient._count?.recipes || 0,
    submittedBy,
    submittedByLabel: submittedBy.fullName,
  };
}

export function formatNotification(notification) {
  return {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    isRead: notification.isRead,
    recipeId: notification.recipeId,
    createdAt: notification.createdAt,
  };
}

export function sendError(res, error, fallbackMessage) {
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: fallbackMessage });
}

export function normalizeMediaKind(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 's' || normalized === 'tv' || normalized === 'series' || normalized === 'serie' || normalized === 'série') {
    return { prismaType: 'SERIES', tmdbType: 'tv' };
  }

  return { prismaType: 'MOVIE', tmdbType: 'movie' };
}

export function extractDirector(tmdbMedia, prismaType) {
  const people = prismaType === 'MOVIE'
    ? (tmdbMedia?.credits?.crew || [])
        .filter((person) => person.job === 'Director')
        .map((person) => person.name)
    : (tmdbMedia?.created_by || [])
        .map((person) => person.name)
        .filter(Boolean);

  return people.length > 0 ? people.join(', ') : null;
}

export function parseEditedFieldsSummary(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeIngredientNameForMatch(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function extractRejectedIngredientNameFromReason(reason) {
  const message = String(reason || '').trim();
  const quotedIngredientMatch = message.match(/ingredient\s+"([^"]+)"/i);
  return quotedIngredientMatch?.[1]?.trim() || null;
}

export function stringifyEditedFieldsSummary(fields) {
  return Array.from(new Set(fields))
    .filter(Boolean)
    .join(', ');
}

export function buildAdminEditedFieldsSentence(summary) {
  const fields = parseEditedFieldsSummary(summary);

  if (fields.length === 0) {
    return null;
  }

  if (fields.length === 1) {
    return fields[0];
  }

  if (fields.length === 2) {
    return `${fields[0]} et ${fields[1]}`;
  }

  return `${fields.slice(0, -1).join(', ')} et ${fields.at(-1)}`;
}

export async function resolveAdminMediaId({ tmdbId, mediaId, mediaTitle, mediaType }) {
  if (mediaId !== undefined && mediaId !== null && mediaId !== '') {
    return mediaId;
  }

  if (tmdbId === undefined || tmdbId === null || tmdbId === '') {
    return undefined;
  }

  const normalizedTmdbId = parseInt(tmdbId, 10);
  if (!Number.isInteger(normalizedTmdbId) || normalizedTmdbId <= 0) {
    throw new Error('Média invalide. Sélectionne un film depuis TMDB.');
  }

  const { prismaType, tmdbType } = normalizeMediaKind(mediaType);

  const existingMedia = await prisma.media.findUnique({
    where: {
      tmdbId_type: {
        tmdbId: normalizedTmdbId,
        type: prismaType,
      },
    },
  });

  if (existingMedia) {
    return existingMedia.id;
  }

  const response = await fetch(
    `${process.env.TMDB_BASE_URL}/${tmdbType}/${normalizedTmdbId}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR&append_to_response=credits`
  );

  if (!response.ok) {
    throw new Error('Impossible de récupérer ce média depuis TMDB.');
  }

  const tmdbMedia = await response.json();
  const title = String(mediaTitle || tmdbMedia?.title || tmdbMedia?.name || '').trim();

  if (!title) {
    throw new Error('Titre du média manquant.');
  }

  const realisateur = extractDirector(tmdbMedia, prismaType);

  const releaseYear = Number.parseInt(String(tmdbMedia?.release_date || tmdbMedia?.first_air_date || '').slice(0, 4), 10);
  const mediaSlug = await generateUniqueSlug(
    `${title}-${Number.isInteger(releaseYear) ? releaseYear : new Date().getFullYear()}`,
    (slug) => prisma.media.findUnique({ where: { slug } }),
  );

  const tmdbPosterUrl = tmdbMedia?.poster_path
    ? `https://image.tmdb.org/t/p/w500${tmdbMedia.poster_path}`
    : null;

  const localPosterUrl = tmdbPosterUrl
    ? await downloadAndConvertPoster(tmdbPosterUrl)
    : null;

  const createdMedia = await prisma.media.create({
    data: {
      tmdbId: normalizedTmdbId,
      titre: title,
      slug: mediaSlug,
      type: prismaType,
      posterUrl: localPosterUrl || tmdbPosterUrl,
      synopsis: tmdbMedia?.overview || null,
      annee: Number.isInteger(releaseYear) ? releaseYear : null,
      realisateur,
    },
  });

  return createdMedia.id;
}
