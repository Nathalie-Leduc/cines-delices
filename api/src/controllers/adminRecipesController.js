import { prisma } from '../lib/prisma.js';
import { generateUniqueSlug } from '../utils/slug.js';
import {
  formatRecipe,
  sendError,
  normalizeIngredientNameForMatch,
  extractRejectedIngredientNameFromReason,
  stringifyEditedFieldsSummary,
  buildAdminEditedFieldsSentence,
  parseEditedFieldsSummary,
  resolveAdminMediaId,
} from './adminHelpers.js';

const recipeRelationsInclude = {
  user: { select: { nom: true, pseudo: true } },
  category: true,
  media: true,
  ingredients: { include: { ingredient: true } },
};

export async function getAdminRecipes(req, res) {
  try {
    const search = String(req.query.search || '').trim();
    const category = String(req.query.category || '').trim();
    const status = String(req.query.status || '').trim();

//  forcer PUBLISHED par défaut, sauf si status explicitement passé :
    const where = {
  // ✅ CORRECTIF 6 — "Gérer les recettes" ne montre que les recettes publiées.
  // Les recettes PENDING et DRAFT ont leur propre espace (Validation des recettes).
  // Si un status est explicitement passé en query, on le respecte (usage futur).
  // Analogie : la vitrine du restaurant n'affiche que les plats du jour prêts à servir,
  // pas ceux en cuisine ni ceux refusés par le chef.
      status: status || 'PUBLISHED',
      ...(search ? { titre: { contains: search, mode: 'insensitive' } } : {}),
      ...(category && category !== 'Tous'
      ? { category: { nom: { equals: category, mode: 'insensitive' } } }
      : {}),
    };

    const recipes = await prisma.recipe.findMany({
      where,
      include: recipeRelationsInclude,
      orderBy: { createdAt: 'desc' },
    });

    return res.json(recipes.map(formatRecipe));
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la récupération des recettes admin.');
  }
}

export async function getPendingRecipes(req, res) {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { status: 'PENDING' },
      include: recipeRelationsInclude,
      orderBy: { createdAt: 'desc' },
    });

    return res.json(recipes.map(formatRecipe));
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la récupération des recettes en attente.');
  }
}

export async function publishRecipe(req, res) {
  try {
    const recipeBeforeApproval = await prisma.recipe.findUnique({
      where: { id: req.params.id },
      include: { ingredients: { include: { ingredient: true } } },
    });

    if (!recipeBeforeApproval) {
      return res.status(404).json({ message: 'Recette introuvable.' });
    }

    const pendingIngredients = recipeBeforeApproval.ingredients
      .filter((item) => !item.ingredient?.approved)
      .map((item) => item.ingredient?.nom)
      .filter(Boolean);

    if (pendingIngredients.length > 0) {
      return res.status(409).json({
        message: `Impossible de valider la recette tant que ces ingrédients ne sont pas approuvés : ${pendingIngredients.join(', ')}`,
      });
    }

    const updatedRecipe = await prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.update({
        where: { id: req.params.id },
        data: {
          status: 'PUBLISHED',
          rejectionReason: null,
          adminEditedSinceSubmission: false,
          adminEditedIngredientsSinceSubmission: false,
          adminEditedFieldsSummary: null,
        },
        include: recipeRelationsInclude,
      });

      if (recipe.userId) {
        const editedFieldsSentence = buildAdminEditedFieldsSentence(
          recipeBeforeApproval.adminEditedFieldsSummary,
        );
        const publicationMessage = editedFieldsSentence
          ? `Votre recette "${recipe.titre}" a ete validee et publiee apres modification par l'admin : ${editedFieldsSentence}.`
          : recipeBeforeApproval.adminEditedIngredientsSinceSubmission
            ? `Votre recette "${recipe.titre}" a ete validee et publiee apres modification de ses ingredients par l'admin.`
            : recipeBeforeApproval.adminEditedSinceSubmission
              ? `Votre recette "${recipe.titre}" a ete validee et publiee apres modification par l'admin.`
              : `Votre recette "${recipe.titre}" a ete validee et publiee.`;

        await tx.notification.create({
          data: {
            userId: recipe.userId,
            recipeId: recipe.id,
            type: 'RECIPE_SUBMITTED',
            message: publicationMessage,
          },
        });
      }

      await tx.notification.updateMany({
        where: { userId: req.user.id, recipeId: req.params.id, isRead: false },
        data: { isRead: true },
      });

      return recipe;
    });

    return res.json(formatRecipe(updatedRecipe));
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la validation de la recette.');
  }
}

export async function rejectRecipe(req, res) {
  try {
    const rejectionReason = String(req.body.rejectionReason || '').trim();
    const rejectedIngredientName = extractRejectedIngredientNameFromReason(rejectionReason);

    if (rejectionReason.length < 10) {
      return res.status(400).json({ message: 'Le motif de refus est obligatoire (min 10 caractères).' });
    }

    const updatedRecipe = await prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.update({
        where: { id: req.params.id },
        data: {
          status: 'DRAFT',
          rejectionReason,
          adminEditedSinceSubmission: false,
          adminEditedIngredientsSinceSubmission: false,
          adminEditedFieldsSummary: null,
        },
        include: recipeRelationsInclude,
      });

      if (rejectedIngredientName) {
        const normalizedRejectedIngredientName = normalizeIngredientNameForMatch(rejectedIngredientName);
        const matchingIngredient = recipe.ingredients
          .map((item) => item.ingredient)
          .find((ingredient) => normalizeIngredientNameForMatch(ingredient.nom) === normalizedRejectedIngredientName);

        if (matchingIngredient) {
          await tx.recipeIngredient.deleteMany({
            where: { recipeId: recipe.id, ingredientId: matchingIngredient.id },
          });

          const remainingUsageCount = await tx.recipeIngredient.count({
            where: { ingredientId: matchingIngredient.id },
          });

          if (remainingUsageCount === 0 && !matchingIngredient.approved) {
            await tx.ingredient.delete({ where: { id: matchingIngredient.id } });

            await tx.notification.updateMany({
              where: {
                userId: req.user.id,
                isRead: false,
                message: `Nouvel ingrédient soumis: ${matchingIngredient.nom}`,
              },
              data: { isRead: true },
            });
          }
        }
      }

      if (recipe.userId) {
        await tx.notification.create({
          data: {
            userId: recipe.userId,
            recipeId: recipe.id,
            type: 'RECIPE_SUBMITTED',
            message: `Votre recette "${recipe.titre}" a ete refusee. Motif : ${recipe.rejectionReason}`,
          },
        });
      }

      await tx.notification.updateMany({
        where: { userId: req.user.id, recipeId: req.params.id, isRead: false },
        data: { isRead: true },
      });

      return tx.recipe.findUnique({
        where: { id: recipe.id },
        include: recipeRelationsInclude,
      });
    });

    return res.json(formatRecipe(updatedRecipe));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Recette introuvable.' });
    }
    return sendError(res, error, 'Erreur lors du refus de la recette.');
  }
}

export const approveRecipe = publishRecipe;

export async function deleteRecipe(req, res) {
  try {
    const { notifMessage } = req.body;

    // Récupérer la recette AVANT suppression
    // (une fois supprimée, elle n'existe plus en BDD)
    const recipe = await prisma.recipe.findUnique({
      where: { id: req.params.id },
    });

    if (!recipe) {
      return res.status(404).json({ message: 'Recette introuvable.' });
    }

    // Créer la notification pour le membre auteur (si la recette appartient à quelqu'un)
    if (recipe.userId) {
      const message =
        String(notifMessage || '').trim() ||
        `Votre recette "${recipe.titre}" a été supprimée par l'administrateur.`;

      await prisma.notification.create({
        data: {
          userId: recipe.userId,
          recipeId: null, // null obligatoire : la recette va être supprimée juste après
          type: 'RECIPE_SUBMITTED',
          message,
        },
      });
    }

    // Supprimer la recette après avoir créé la notification
    await prisma.recipe.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la suppression de la recette.');
  }
}

export async function updateAdminRecipe(req, res) {
  try {
    const { id } = req.params;
    const {
      titre,
      instructions,
      nombrePersonnes,
      tempsPreparation,
      tempsCuisson,
      categoryId,
      categoryName,
      mediaId,
      tmdbId,
      mediaTitle,
      mediaType,
      imageUrl,
      ingredients,
    } = req.body;

    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
      include: { category: true, media: true, ingredients: { include: { ingredient: true } } },
    });

    if (!existingRecipe) {
      return res.status(404).json({ message: 'Recette introuvable.' });
    }

    const data = {};
    const editedFields = new Set(parseEditedFieldsSummary(existingRecipe.adminEditedFieldsSummary));

    if (titre !== undefined) {
      data.titre = String(titre).trim();
      data.slug = await generateUniqueSlug(
        data.titre,
        (candidate) => prisma.recipe.findUnique({ where: { slug: candidate } })
      );
      if (data.titre !== existingRecipe.titre) editedFields.add('le titre');
    }
    if (instructions !== undefined) {
      data.instructions = String(instructions).trim();
      if (data.instructions !== existingRecipe.instructions) editedFields.add('les etapes');
    }
    if (nombrePersonnes !== undefined) {
      data.nombrePersonnes = nombrePersonnes ? parseInt(nombrePersonnes, 10) : null;
      if (data.nombrePersonnes !== existingRecipe.nombrePersonnes) editedFields.add('le nombre de personnes');
    }
    if (tempsPreparation !== undefined) {
      data.tempsPreparation = tempsPreparation ? parseInt(tempsPreparation, 10) : null;
      if (data.tempsPreparation !== existingRecipe.tempsPreparation) editedFields.add('le temps de preparation');
    }
    if (tempsCuisson !== undefined) {
      data.tempsCuisson = tempsCuisson ? parseInt(tempsCuisson, 10) : null;
      if (data.tempsCuisson !== existingRecipe.tempsCuisson) editedFields.add('le temps de cuisson');
    }
    if (imageUrl !== undefined) {
      data.imageURL = String(imageUrl).trim() || null;
      if (data.imageURL !== existingRecipe.imageURL) editedFields.add("l'image");
    }

    if (tmdbId !== undefined || mediaId !== undefined) {
      const resolvedMediaId = await resolveAdminMediaId({ tmdbId, mediaId, mediaTitle, mediaType });
      if (resolvedMediaId !== undefined) {
        data.media = { connect: { id: resolvedMediaId } };
        if (resolvedMediaId !== existingRecipe.mediaId) editedFields.add('le film ou la serie');
      }
    }

    if (categoryId !== undefined) {
      data.category = { connect: { id: categoryId } };
      if (categoryId !== existingRecipe.categoryId) editedFields.add('la categorie');
    } else if (categoryName !== undefined) {
      const category = await prisma.category.findFirst({
        where: { nom: { equals: categoryName, mode: 'insensitive' } },
      });
      if (category) {
        data.category = { connect: { id: category.id } };
        if (category.id !== existingRecipe.categoryId) editedFields.add('la categorie');
      }
    }

    if (Array.isArray(ingredients)) {
      const resolvedIngredients = [];

      for (const item of ingredients) {
        const rawIngredientId = item?.ingredientId || item?.id || null;
        const quantity = item?.quantite ?? item?.quantity ?? null;
        const unit = item?.unite ?? item?.unit ?? null;

        if (rawIngredientId) {
          resolvedIngredients.push({
            ingredientId: rawIngredientId,
            quantity: quantity ? String(quantity) : null,
            unit: unit ? String(unit) : null,
          });
          continue;
        }

        const rawName = String(item?.nom ?? item?.name ?? '').trim().toLowerCase();
        if (!rawName) continue;

        const ingredient = await prisma.ingredient.upsert({
          where: { nom: rawName },
          update: {},
          create: { nom: rawName },
        });

        resolvedIngredients.push({
          ingredientId: ingredient.id,
          quantity: quantity ? String(quantity) : null,
          unit: unit ? String(unit) : null,
        });
      }

      const deduped = Array.from(
        new Map(resolvedIngredients.map((entry) => [entry.ingredientId, entry])).values(),
      );

      const previousSnap = existingRecipe.ingredients
        .map((e) => `${e.ingredientId}:${e.quantity || ''}:${e.unit || ''}`)
        .sort().join('|');
      const nextSnap = deduped
        .map((e) => `${e.ingredientId}:${e.quantity || ''}:${e.unit || ''}`)
        .sort().join('|');

      if (previousSnap !== nextSnap) editedFields.add('les ingredients');

      data.ingredients = {
        deleteMany: {},
        create: deduped.map((entry) => ({
          ingredientId: entry.ingredientId,
          quantity: entry.quantity,
          unit: entry.unit,
        })),
      };
    }

    if (existingRecipe.status === 'PENDING') {
      data.adminEditedSinceSubmission = true;
      if (Array.isArray(ingredients)) data.adminEditedIngredientsSinceSubmission = true;
      data.adminEditedFieldsSummary = stringifyEditedFieldsSummary(editedFields);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'Aucun champ à modifier.' });
    }

    const updated = await prisma.recipe.update({
      where: { id },
      data,
      include: recipeRelationsInclude,
    });

    return res.json(formatRecipe(updated));
  } catch (error) {
    if (error instanceof Error && error.message) {
      if (
        error.message.includes('TMDB')
        || error.message.includes('Média invalide')
        || error.message.includes('Titre du média manquant')
        || error.message.includes('Impossible de récupérer ce média')
      ) {
        return res.status(400).json({ message: error.message });
      }
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Recette introuvable.' });
    }
    return sendError(res, error, 'Erreur lors de la modification de la recette.');
  }
}

export async function getAdminUserRecipes(req, res) {
  try {
    const { id } = req.params;
    const recipes = await prisma.recipe.findMany({
      where: {
        userId: id,
        // Hors brouillons purs (jamais soumis)
        NOT: { AND: [{ status: 'DRAFT' }, { rejectionReason: null }] },
      },
      include: recipeRelationsInclude,
      orderBy: { createdAt: 'desc' },
    });
    return res.json(recipes.map(formatRecipe));
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la récupération des recettes du membre.');
  }
}