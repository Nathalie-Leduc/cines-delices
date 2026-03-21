import { prisma } from '../lib/prisma.js';
import { generateUniqueSlug } from '../utils/slug.js';

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
 * Récupère une recette par ID
 * GET /api/recipes/:id
 */
export const getRecipe = async (req, res) => {
  try {
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
      return res.status(404).json({ message: 'Recette introuvable' });
    }

    return res.json(recipe);
  } catch (error) {
    console.error('[getRecipe]', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération de la recette.' });
  }
};

/**
 * Met à jour une recette
 * PATCH /api/recipes/:id
 */
export const updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, instructions, categoryId, mediaId, nombrePersonnes, tempsPreparation, tempsCuisson, ingredients } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    // Vérifier que la recette existe et appartient à l'utilisateur
    const recipe = await prisma.recipe.findUnique({ where: { id } });
    if (!recipe) {
      return res.status(404).json({ message: 'Recette introuvable' });
    }

    if (recipe.userId !== userId) {
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

    return res.json({ message: 'Recette mise à jour', recipe: updated });
  } catch (error) {
    console.error('[updateRecipe]', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de la recette.' });
  }
};

/**
 * Supprime une recette
 * DELETE /api/recipes/:id
 */
export const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    // Vérifier que la recette existe et appartient à l'utilisateur
    const recipe = await prisma.recipe.findUnique({ where: { id } });
    if (!recipe) {
      return res.status(404).json({ message: 'Recette introuvable' });
    }

    if (recipe.userId !== userId) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette recette' });
    }

    // Supprimer la recette (Prisma supprimera les ingrédients à cause de onDelete: Cascade)
    await prisma.recipe.delete({ where: { id } });

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
export const getAllPublishedRecipes = async (req, res) => {
  try {
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

    return res.json(recipes);
  } catch (error) {
    console.error('[getAllPublishedRecipes]', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération des recettes.' });
  }
};
