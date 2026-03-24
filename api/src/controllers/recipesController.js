import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/responseHelper.js';
import { generateUniqueSlug } from '../utils/slug.js';
import asyncHandler from 'express-async-handler';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function buildRecipeLookupWhere(identifier) {
  const normalizedIdentifier = String(identifier || '').trim();
  const orConditions = [{ slug: normalizedIdentifier }];

  if (UUID_REGEX.test(normalizedIdentifier)) {
    orConditions.unshift({ id: normalizedIdentifier });
  }

  return { OR: orConditions };
}

async function findRecipeByIdOrSlug(identifier, options = {}) {
  return prisma.recipe.findFirst({
    where: buildRecipeLookupWhere(identifier),
    ...options,
  });
}

function canManageRecipe(user, recipe) {
  if (!user || !recipe) {
    return false;
  }

  return user.role === 'ADMIN' || user.id === recipe.userId;
}

const recipeRelationsInclude = {
  category: true,
  media: true,
  ingredients: {
    include: {
      ingredient: true,
    },
  },
};

/**
 * Crée une nouvelle recette
 * POST /api/recipes
 */
export const createRecipe = async (req, res) => {
  try {
    const {
      titre,
      instructions,
      etapes,
      categoryId: rawCategoryId,
      categorie,
      mediaId: rawMediaId,
      filmId,
      film,
      type,
      imageUrl,
      nombrePersonnes,
      nbPersonnes,
      tempsPreparation,
      tempsCuisson,
      ingredients,
    } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    const mergedSteps = Array.isArray(etapes)
      ? etapes.map((step) => String(step || '').trim()).filter(Boolean)
      : [];
    const normalizedInstructions = String(instructions || '').trim() || mergedSteps.join('\n');

    let categoryId = rawCategoryId;

    // Vérifier/résoudre la catégorie
    let category = null;
    if (categoryId) {
      category = await prisma.category.findUnique({ where: { id: categoryId } });
    } else if (categorie) {
      const normalizedCategoryName = String(categorie).trim();

      category = await prisma.category.findFirst({
        where: {
          nom: {
            equals: normalizedCategoryName,
            mode: 'insensitive',
          },
        },
      });

      if (!category && normalizedCategoryName) {
        category = await prisma.category.create({
          data: {
            nom: normalizedCategoryName,
          },
        });
      }

      categoryId = category?.id;
    }

    if (!category) {
      return res.status(404).json({ message: 'Catégorie introuvable' });
    }

    let mediaId = rawMediaId;

    // Vérifier/résoudre le média
    if (mediaId) {
      const existingMedia = await prisma.media.findUnique({ where: { id: mediaId } });
      if (!existingMedia) {
        return res.status(404).json({ message: 'Média introuvable' });
      }
    } else {
      const tmdbId = Number(filmId);
      if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
        return res.status(400).json({ message: 'Média invalide. Sélectionne un film/série depuis la recherche.' });
      }

      const normalizedTitle = String(film || '').trim();
      if (!normalizedTitle) {
        return res.status(400).json({ message: 'Titre du média manquant.' });
      }

      const normalizedType = String(type || '').toLowerCase();
      const mediaType = (normalizedType === 's' || normalizedType === 'tv' || normalizedType === 'series')
        ? 'SERIES'
        : 'MOVIE';

      const mediaSlug = await generateUniqueSlug(
        `${normalizedTitle}-${new Date().getFullYear()}`,
        (s) => prisma.media.findUnique({ where: { slug: s } }),
      );

      const media = await prisma.media.upsert({
        where: { tmdbId },
        update: {
          titre: normalizedTitle,
          type: mediaType,
          posterUrl: imageUrl || undefined,
        },
        create: {
          tmdbId,
          titre: normalizedTitle,
          slug: mediaSlug,
          type: mediaType,
          posterUrl: imageUrl || null,
        },
      });

      mediaId = media.id;
    }

    if (normalizedInstructions.length < 1) {
      return res.status(400).json({ message: 'Les instructions sont obligatoires.' });
    }

    const normalizedNombrePersonnes = nombrePersonnes ?? nbPersonnes;

    // Créer la recette
    const recipeSlug = await generateUniqueSlug(
      titre,
      (s) => prisma.recipe.findUnique({ where: { slug: s } }),
    );

    const recipe = await prisma.recipe.create({
      data: {
        titre,
        slug: recipeSlug,
        instructions: normalizedInstructions,
        userId,
        categoryId,
        mediaId,
        nombrePersonnes: normalizedNombrePersonnes,
        tempsPreparation,
        tempsCuisson,
        status: 'PENDING', // Les recettes doivent être approuvées par un admin
      },
      include: recipeRelationsInclude,
    });

    // Ajouter les ingrédients si fournis
    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        // Chercher ou créer l'ingrédient
        const ingredientName = String(ing.nom || '').toLowerCase().trim();
        const quantity = ing.quantity ?? ing.quantite ?? null;
        const unit = ing.unit ?? ing.unite ?? null;

        const ingredient = await prisma.ingredient.upsert({
          where: { nom: ingredientName },
          update: {},
          create: { nom: ingredientName },
        });

        // Ajouter à la recette
        await prisma.recipeIngredient.create({
          data: {
            recipeId: recipe.id,
            ingredientId: ingredient.id,
            quantity: quantity !== null && quantity !== undefined ? String(quantity) : null,
            unit,
          },
        });
      }
    }

    // Notifier tous les admins de la nouvelle recette en attente
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    if (adminUsers.length > 0) {
      await prisma.notification.createMany({
        data: adminUsers.map((admin) => ({
          type: 'RECIPE_SUBMITTED',
          message: `Nouvelle recette soumise: ${titre}`,
          userId: admin.id,
          recipeId: recipe.id,
        })),
      });
    }

    return res.status(201).json({
      message: 'Recette créée avec succès. Elle sera vérifiée par un administrateur.',
      recipe,
    });
  } catch (error) {
    console.error('[createRecipe]', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la création de la recette.' });
  }
};

/**
 * Récupère une recette par ID ou slug
 * GET /api/recipes/:id
 */
export const getRecipe = async (req, res) => {
  try {
    const { id } = req.params;

    const recipe = await findRecipeByIdOrSlug(id, {
      include: {
        ...recipeRelationsInclude,
        user: {
          select: {
            id: true,
            pseudo: true,
            email: true,
          },
        },
      },
    });

    if (!recipe) {
      return res.status(404).json({ message: 'Recette introuvable' });
    }

    return res.json(recipe);
  } catch (error) {
    console.error('[getRecipe]', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération de la recette.' });
  }
};

/**
 * Récupère toutes les recettes de l'utilisateur connecté
 * GET /api/recipes/mine
 */
export const getMyRecipes = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Utilisateur non authentifié' });
  }

  const recipes = await prisma.recipe.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: recipeRelationsInclude,
  });

  return res.json(recipes);
});

/**
 * Met à jour une recette
 * PATCH /api/recipes/:id
 */
export const updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, instructions, categoryId, mediaId, nombrePersonnes, tempsPreparation, tempsCuisson, ingredients } = req.body;
    const user = req.user;
    const userId = user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    const recipe = await findRecipeByIdOrSlug(id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recette introuvable' });
    }

    if (!canManageRecipe(user, recipe)) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette recette' });
    }

    // Valider les références si fournies
    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        return res.status(404).json({ message: 'Catégorie introuvable' });
      }
    }

    if (mediaId) {
      const media = await prisma.media.findUnique({ where: { id: mediaId } });
      if (!media) {
        return res.status(404).json({ message: 'Média introuvable' });
      }
    }

    // Mettre à jour la recette
    const data = {};
    if (titre !== undefined) data.titre = titre;
    if (instructions !== undefined) data.instructions = instructions;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (mediaId !== undefined) data.mediaId = mediaId;
    if (nombrePersonnes !== undefined) data.nombrePersonnes = nombrePersonnes;
    if (tempsPreparation !== undefined) data.tempsPreparation = tempsPreparation;
    if (tempsCuisson !== undefined) data.tempsCuisson = tempsCuisson;

    const updated = await prisma.recipe.update({
      where: { id: recipe.id },
      data,
      include: recipeRelationsInclude,
    });

    // Mettre à jour les ingrédients si fournis
    if (ingredients && ingredients.length > 0) {
      // Supprimer les anciens ingrédients
      await prisma.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });

      // Ajouter les nouveaux
      for (const ing of ingredients) {
        const ingredient = await prisma.ingredient.upsert({
          where: { nom: ing.nom.toLowerCase().trim() },
          update: {},
          create: { nom: ing.nom.toLowerCase().trim() },
        });

        await prisma.recipeIngredient.create({
          data: {
            recipeId: recipe.id,
            ingredientId: ingredient.id,
            quantity: ing.quantity,
            unit: ing.unit,
          },
        });
      }
    }

    return res.json({ message: 'Recette mise à jour', recipe: updated });
  } catch (error) {
    console.error('[updateRecipe]', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de la recette.' });
  }
};

/**
 * Soumet une recette en attente de validation admin
 * PATCH /api/recipes/:id/submit
 */
export const submitRecipe = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Utilisateur non authentifié' });
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: {
      id: true,
      titre: true,
      userId: true,
      status: true,
    },
  });

  if (!recipe) {
    return res.status(404).json({ message: 'Recette introuvable' });
  }

  if (recipe.userId !== userId) {
    return res.status(403).json({ message: "Vous n'êtes pas autorisé à soumettre cette recette" });
  }

  if (recipe.status === 'PENDING') {
    return res.status(400).json({ message: 'Cette recette est deja en attente de validation.' });
  }

  if (recipe.status !== 'DRAFT') {
    return res.status(400).json({ message: 'Seules les recettes en brouillon peuvent etre soumises.' });
  }

  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  const updatedRecipe = await prisma.$transaction(async (tx) => {
    const pendingRecipe = await tx.recipe.update({
      where: { id },
      data: {
        status: 'PENDING',
      },
      include: recipeRelationsInclude,
    });

    if (adminUsers.length > 0) {
      await tx.notification.createMany({
        data: adminUsers.map((admin) => ({
          type: 'RECIPE_SUBMITTED',
          message: `Nouvelle recette soumise: ${recipe.titre}`,
          userId: admin.id,
          recipeId: recipe.id,
        })),
      });
    }

    return pendingRecipe;
  });

  return res.json({ message: 'Recette soumise pour validation.', recipe: updatedRecipe });
});

/**
 * Supprime une recette
 * DELETE /api/recipes/:id
 */
export const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const userId = user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    const recipe = await findRecipeByIdOrSlug(id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recette introuvable' });
    }

    if (!canManageRecipe(user, recipe)) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette recette' });
    }

    // Supprimer la recette (Prisma supprimera les ingrédients à cause de onDelete: Cascade)
    await prisma.recipe.delete({ where: { id: recipe.id } });

    return res.json({ message: 'Recette supprimée' });
  } catch (error) {
    console.error('[deleteRecipe]', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la suppression de la recette.' });
  }
};

/**
 * Récupère toutes les recettes publiées (pour les membres)
 * GET /api/recipes?published=true
 */
export const getAllPublishedRecipes = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const requestedLimit = Number(req.query.limit || 12);
  const limit = Math.min(Math.max(requestedLimit, 1), 50);
  const skip = (page - 1) * limit;
  const categoryFilter = String(req.query.category || '').trim();
  const searchQuery = String(req.query.q || '').trim();

  const andFilters = [{ status: 'PUBLISHED' }];

  if (categoryFilter) {
    andFilters.push({
      OR: [
        { categoryId: categoryFilter },
        {
          category: {
            nom: {
              equals: categoryFilter,
              mode: 'insensitive',
            },
          },
        },
      ],
    });
  }

  if (searchQuery) {
    andFilters.push({
      OR: [
        {
          titre: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          category: {
            nom: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
        },
        {
          media: {
            titre: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
        },
      ],
    });
  }

  const where = { AND: andFilters };

  const [recipes, totalItems] = await prisma.$transaction([
    prisma.recipe.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        ...recipeRelationsInclude,
        user: {
          select: {
            id: true,
            pseudo: true,
          },
        },
      },
    }),
    prisma.recipe.count({ where }),
  ]);

  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
  const pagination = {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };

  res.json({
    recipes,
    pagination,
  });
});
