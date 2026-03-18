import { prisma } from '../lib/prisma.js';
import { successResponse, asyncHandler } from '../lib/responseHelper.js';

/**
 * Crée une nouvelle recette
 * POST /api/recipes
 */
export const createRecipe = asyncHandler(async (req, res) => {
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
    const err = new Error('Utilisateur non authentifié');
    err.statusCode = 401;
    throw err;
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
    const err = new Error('Catégorie introuvable');
    err.statusCode = 404;
    throw err;
  }

  let mediaId = rawMediaId;

  // Vérifier/résoudre le média
  if (mediaId) {
    const existingMedia = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!existingMedia) {
      const err = new Error('Média introuvable');
      err.statusCode = 404;
      throw err;
    }
  } else {
    const tmdbId = Number(filmId);
    if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
      const err = new Error('Média invalide. Sélectionne un film/série depuis la recherche.');
      err.statusCode = 400;
      throw err;
    }

    const normalizedTitle = String(film || '').trim();
    if (!normalizedTitle) {
      const err = new Error('Titre du média manquant.');
      err.statusCode = 400;
      throw err;
    }

    const normalizedType = String(type || '').toLowerCase();
    const mediaType = (normalizedType === 's' || normalizedType === 'tv' || normalizedType === 'series')
      ? 'SERIES'
      : 'MOVIE';

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
        type: mediaType,
        posterUrl: imageUrl || null,
      },
    });

    mediaId = media.id;
  }

  if (normalizedInstructions.length < 1) {
    const err = new Error('Les instructions sont obligatoires.');
    err.statusCode = 400;
    throw err;
  }

  const normalizedNombrePersonnes = nombrePersonnes ?? nbPersonnes;

  // Créer la recette
  const recipe = await prisma.recipe.create({
    data: {
      titre,
      instructions: normalizedInstructions,
      userId,
      categoryId,
      mediaId,
      nombrePersonnes: normalizedNombrePersonnes,
      tempsPreparation,
      tempsCuisson,
      status: 'PENDING', // Les recettes doivent être approuvées par un admin
    },
    include: {
      category: true,
      media: true,
      ingredients: {
        include: {
          ingredient: true,
        },
      },
    },
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

  res.status(201).json(successResponse(recipe, 'Recette créée avec succès. Elle sera vérifiée par un administrateur.', 201));
});

/**
 * Récupère une recette par ID
 * GET /api/recipes/:id
 */
export const getRecipe = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      category: true,
      media: true,
      user: {
        select: {
          id: true,
          pseudo: true,
          email: true,
        },
      },
      ingredients: {
        include: {
          ingredient: true,
        },
      },
    },
  });

  if (!recipe) {
    const err = new Error('Recette introuvable');
    err.statusCode = 404;
    throw err;
  }

  res.json(successResponse(recipe, 'Recette récupérée'));
});

/**
 * Met à jour une recette
 * PATCH /api/recipes/:id
 */
export const updateRecipe = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { titre, instructions, categoryId, mediaId, nombrePersonnes, tempsPreparation, tempsCuisson, ingredients } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    const err = new Error('Utilisateur non authentifié');
    err.statusCode = 401;
    throw err;
  }

  // Vérifier que la recette existe et appartient à l'utilisateur
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) {
    const err = new Error('Recette introuvable');
    err.statusCode = 404;
    throw err;
  }

  if (recipe.userId !== userId) {
    const err = new Error('Vous n\'êtes pas autorisé à modifier cette recette');
    err.statusCode = 403;
    throw err;
  }

  // Valider les références si fournies
  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      const err = new Error('Catégorie introuvable');
      err.statusCode = 404;
      throw err;
    }
  }

  if (mediaId) {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) {
      const err = new Error('Média introuvable');
      err.statusCode = 404;
      throw err;
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
    where: { id },
    data,
    include: {
      category: true,
      media: true,
      ingredients: {
        include: {
          ingredient: true,
        },
      },
    },
  });

  // Mettre à jour les ingrédients si fournis
  if (ingredients && ingredients.length > 0) {
    // Supprimer les anciens ingrédients
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });

    // Ajouter les nouveaux
    for (const ing of ingredients) {
      const ingredient = await prisma.ingredient.upsert({
        where: { nom: ing.nom.toLowerCase().trim() },
        update: {},
        create: { nom: ing.nom.toLowerCase().trim() },
      });

      await prisma.recipeIngredient.create({
        data: {
          recipeId: id,
          ingredientId: ingredient.id,
          quantity: ing.quantity,
          unit: ing.unit,
        },
      });
    }
  }

  res.json(successResponse(updated, 'Recette mise à jour'));
});

/**
 * Supprime une recette
 * DELETE /api/recipes/:id
 */
export const deleteRecipe = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    const err = new Error('Utilisateur non authentifié');
    err.statusCode = 401;
    throw err;
  }

  // Vérifier que la recette existe et appartient à l'utilisateur
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) {
    const err = new Error('Recette introuvable');
    err.statusCode = 404;
    throw err;
  }

  if (recipe.userId !== userId) {
    const err = new Error('Vous n\'êtes pas autorisé à supprimer cette recette');
    err.statusCode = 403;
    throw err;
  }

  // Supprimer la recette (Prisma supprimera les ingrédients à cause de onDelete: Cascade)
  await prisma.recipe.delete({ where: { id } });

  res.json(successResponse(null, 'Recette supprimée'));
});

/**
 * Récupère toutes les recettes publiées (pour les membres)
 * GET /api/recipes?published=true
 */
export const getAllPublishedRecipes = asyncHandler(async (req, res) => {
  const published = req.query.published === 'true';

  const recipes = await prisma.recipe.findMany({
    where: published ? { status: 'PUBLISHED' } : {},
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      media: true,
      user: {
        select: {
          id: true,
          pseudo: true,
        },
      },
      ingredients: {
        include: {
          ingredient: true,
        },
      },
    },
  });

  res.json(successResponse(recipes, `${recipes.length} recette(s) trouvée(s)`));
});
