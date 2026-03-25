import { prisma } from '../lib/prisma.js';
import { generateUniqueSlug } from '../utils/slug.js';

const DEFAULT_CATEGORY_COLORS = {
  'entrée': '#84A767',
  entree: '#84A767',
  plat: '#8E1F2F',
  dessert: '#6F4D39',
  boisson: '#3A8A9A',
};

function getCategoryColor(categoryColor, categoryName) {
  // Prefer database color if set
  if (categoryColor) {
    return categoryColor;
  }

  // Fall back to default colors by name
  const key = String(categoryName || '').trim().toLowerCase();
  return DEFAULT_CATEGORY_COLORS[key] || '#C9A45C';
}

function normalizeNamePart(value) {
  return String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function toDisplayWords(value) {
  return String(value || '')
    .trim()
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function formatSubmitter(user) {
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

function formatRecipe(recipe) {
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
    image: recipe.imageURL || recipe.media?.posterUrl || '/img/entrees.png',
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

function formatUser(user) {
  const recipeCounts = user.recipes.reduce((accumulator, recipe) => {
    const key = String(recipe.category?.nom || '').trim().toLowerCase();
    if (key) {
      accumulator[key] = (accumulator[key] || 0) + 1;
    }
    return accumulator;
  }, {});

  return {
    id: user.id,
    nom: user.pseudo.toUpperCase(),
    displayName: user.pseudo,
    // Compat temporaire avec le front existant
    prenom: user.pseudo,
    email: user.email,
    role: user.role,
    recipeCounts: {
      entree: recipeCounts['entrée'] || recipeCounts.entree || 0,
      plat: recipeCounts.plat || 0,
      dessert: recipeCounts.dessert || 0,
      boisson: recipeCounts.boisson || 0,
    },
  };
}

function formatCategory(category) {
  return {
    id: category.id,
    name: category.nom,
    description: category.description || '',
    color: getCategoryColor(category.color, category.nom),
    recipesCount: category._count?.recipes || 0,
  };
}

function formatIngredient(ingredient) {
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

function formatNotification(notification) {
  return {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    isRead: notification.isRead,
    recipeId: notification.recipeId,
    createdAt: notification.createdAt,
  };
}

function sendError(res, error, fallbackMessage) {
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: fallbackMessage });
}

function normalizeMediaKind(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 's' || normalized === 'tv' || normalized === 'series' || normalized === 'serie' || normalized === 'série') {
    return { prismaType: 'SERIES', tmdbType: 'tv' };
  }

  return { prismaType: 'MOVIE', tmdbType: 'movie' };
}

async function resolveAdminMediaId({ tmdbId, mediaId, mediaTitle, mediaType }) {
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

  const existingMedia = await prisma.media.findUnique({ where: { tmdbId: normalizedTmdbId } });
  if (existingMedia) {
    return existingMedia.id;
  }

  const { prismaType, tmdbType } = normalizeMediaKind(mediaType);
  const response = await fetch(
    `${process.env.TMDB_BASE_URL}/${tmdbType}/${normalizedTmdbId}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR`
  );

  if (!response.ok) {
    throw new Error('Impossible de récupérer ce média depuis TMDB.');
  }

  const tmdbMedia = await response.json();
  const title = String(mediaTitle || tmdbMedia?.title || tmdbMedia?.name || '').trim();

  if (!title) {
    throw new Error('Titre du média manquant.');
  }

  const releaseYear = Number.parseInt(String(tmdbMedia?.release_date || tmdbMedia?.first_air_date || '').slice(0, 4), 10);
  const mediaSlug = await generateUniqueSlug(
    `${title}-${Number.isInteger(releaseYear) ? releaseYear : new Date().getFullYear()}`,
    (slug) => prisma.media.findUnique({ where: { slug } }),
  );

  const createdMedia = await prisma.media.create({
    data: {
      tmdbId: normalizedTmdbId,
      titre: title,
      slug: mediaSlug,
      type: prismaType,
      posterUrl: tmdbMedia?.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMedia.poster_path}` : null,
      synopsis: tmdbMedia?.overview || null,
      annee: Number.isInteger(releaseYear) ? releaseYear : null,
    },
  });

  return createdMedia.id;
}

export async function getAdminRecipes(req, res) {
  try {
    const search = String(req.query.search || '').trim();
    const category = String(req.query.category || '').trim();
    const status = String(req.query.status || '').trim();

    const where = {
      ...(search
        ? {
            titre: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(category && category !== 'Tous'
        ? {
            category: {
              nom: {
                equals: category,
                mode: 'insensitive',
              },
            },
          }
        : {}),
      ...(status
        ? {
            status,
          }
        : {}),
    };

    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        user: {
          select: {
            nom: true,
            pseudo: true,
          },
        },
        category: true,
        media: true,
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
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
      include: {
        user: {
          select: {
            nom: true,
            pseudo: true,
          },
        },
        category: true,
        media: true,
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
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
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
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
        },
        include: {
          user: {
            select: {
              nom: true,
              pseudo: true,
            },
          },
          category: true,
          media: true,
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: recipe.userId,
          recipeId: recipe.id,
          type: 'RECIPE_SUBMITTED',
          message: `Votre recette "${recipe.titre}" a ete validee et publiee.`,
        },
      });

      await tx.notification.updateMany({
        where: {
          userId: req.user.id,
          recipeId: req.params.id,
          isRead: false,
        },
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

    if (rejectionReason.length < 10) {
      return res.status(400).json({ message: 'Le motif de refus est obligatoire (min 10 caractères).' });
    }

    const updatedRecipe = await prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.update({
        where: { id: req.params.id },
        data: {
          status: 'DRAFT',
          rejectionReason,
        },
        include: {
          user: {
            select: {
              nom: true,
              pseudo: true,
            },
          },
          category: true,
          media: true,
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: recipe.userId,
          recipeId: recipe.id,
          type: 'RECIPE_SUBMITTED',
          message: `Votre recette "${recipe.titre}" a ete refusee. Motif : ${recipe.rejectionReason}`,
        },
      });

      await tx.notification.updateMany({
        where: {
          userId: req.user.id,
          recipeId: req.params.id,
          isRead: false,
        },
        data: { isRead: true },
      });

      return recipe;
    });

    return res.json(formatRecipe(updatedRecipe));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Recette introuvable.' });
    }

    return sendError(res, error, 'Erreur lors du refus de la recette.');
  }
}

// Alias de compatibilité temporaire
export const approveRecipe = publishRecipe;

export async function deleteRecipe(req, res) {
  try {
    await prisma.recipe.delete({
      where: { id: req.params.id },
    });

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
      ingredients,
    } = req.body;

    const data = {};
    if (titre !== undefined) {
  data.titre = String(titre).trim();
  data.slug = await generateUniqueSlug(
    data.titre,
    (candidate) => prisma.recipe.findUnique({ where: { slug: candidate } })
  );
}
    if (instructions !== undefined) data.instructions = String(instructions).trim();
    if (nombrePersonnes !== undefined) data.nombrePersonnes = nombrePersonnes ? parseInt(nombrePersonnes, 10) : null;
    if (tempsPreparation !== undefined) data.tempsPreparation = tempsPreparation ? parseInt(tempsPreparation, 10) : null;
    if (tempsCuisson !== undefined) data.tempsCuisson = tempsCuisson ? parseInt(tempsCuisson, 10) : null;

    // Résolution du média : par UUID direct ou création depuis TMDB si besoin
    if (tmdbId !== undefined || mediaId !== undefined) {
      const resolvedMediaId = await resolveAdminMediaId({
        tmdbId,
        mediaId,
        mediaTitle,
        mediaType,
      });

      if (resolvedMediaId !== undefined) {
        data.mediaId = resolvedMediaId;
      }
    }
    
    // Si categoryId est fourni, l'utiliser; sinon, retrouver par nom
    if (categoryId !== undefined) {
      data.categoryId = categoryId;
    } else if (categoryName !== undefined) {
      const category = await prisma.category.findFirst({
        where: { nom: { equals: categoryName, mode: 'insensitive' } },
      });
      if (category) {
        data.categoryId = category.id;
      }
    }

    // Ingrédients : remplace la liste complète si fournie par le front
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
        if (!rawName) {
          continue;
        }

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

      // Évite les doublons sur la clé composite (recipeId, ingredientId)
      const deduped = Array.from(
        new Map(resolvedIngredients.map((entry) => [entry.ingredientId, entry])).values(),
      );

      data.ingredients = {
        deleteMany: {},
        ...(deduped.length > 0
          ? {
              create: deduped.map((entry) => ({
                ingredientId: entry.ingredientId,
                quantity: entry.quantity,
                unit: entry.unit,
              })),
            }
          : {}),
      };
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'Aucun champ à modifier.' });
    }

    const updated = await prisma.recipe.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            nom: true,
            pseudo: true,
          },
        },
        category: true,
        media: true,
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
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

export async function getAdminUsers(req, res) {
  try {
    const search = String(req.query.search || '').trim();
    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { pseudo: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        _count: { // nombre total de recettes
          select: { recipes: true },
        },  
        recipes: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

     // Format pour le front
    const formattedUsers = users.map(user => ({
      id: user.id,
      nom: user.pseudo.toUpperCase(),
      displayName: user.pseudo,
      prenom: user.pseudo,
      email: user.email,
      role: user.role,
      totalRecipes: user._count.recipes, // <=== le total de recettes
      recipeCounts: formatUser(user).recipeCounts, // détail par catégorie
    }));


    return res.json(formattedUsers);
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la récupération des utilisateurs admin.');
  }
}

export async function deleteUser(req, res) {
  try {
    await prisma.user.delete({
      where: { id: req.params.id },
    });

    return res.status(204).send();
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la suppression de l\'utilisateur.');
  }
}

export async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (role !== 'MEMBER' && role !== 'ADMIN') {
      return res.status(400).json({ message: 'Rôle invalide. Valeurs acceptées : MEMBER, ADMIN.' });
    }

    // Empêcher un admin de se rétrograder lui-même
    if (req.user.id === id) {
      return res.status(403).json({ message: 'Vous ne pouvez pas modifier votre propre rôle.' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      include: {
        recipes: {
          include: { category: true },
        },
      },
    });

    return res.json(formatUser(user));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }
    return sendError(res, error, 'Erreur lors de la mise à jour du rôle.');
  }
}

export async function getAdminCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { recipes: true },
        },
      },
      orderBy: {
        nom: 'asc',
      },
    });

    return res.json(categories.map(formatCategory));
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la récupération des catégories admin.');
  }
}

export async function createCategory(req, res) {
  try {
    const name = String(req.body.name || '').trim();
    const color = String(req.body.color || '').trim();

    if (!name) {
      return res.status(400).json({ message: 'Le nom de catégorie est requis.' });
    }

    const category = await prisma.category.create({
      data: {
        nom: name,
        ...(color && { color }),
      },
      include: {
        _count: {
          select: { recipes: true },
        },
      },
    });

    return res.status(201).json(formatCategory(category));
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la création de la catégorie.');
  }
}

export async function updateCategory(req, res) {
  try {
    const name = String(req.body.name || '').trim();
    const color = String(req.body.color || '').trim();

    const updateData = {};
    if (name) updateData.nom = name;
    if (color) updateData.color = color;

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        _count: {
          select: { recipes: true },
        },
      },
    });

    return res.json(formatCategory(category));
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la modification de la catégorie.');
  }
}

export async function deleteCategory(req, res) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { recipes: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ message: 'Catégorie introuvable.' });
    }

    if ((category._count?.recipes || 0) > 0) {
      return res.status(409).json({
        message: 'Impossible de supprimer une catégorie déjà utilisée par des recettes.',
      });
    }

    await prisma.category.delete({
      where: { id: req.params.id },
    });

    return res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Catégorie introuvable.' });
    }

    return sendError(res, error, 'Erreur lors de la suppression de la catégorie.');
  }
}

export async function getAdminIngredients(req, res) {
  try {
    const search = String(req.query.search || '').trim();
    const ingredients = await prisma.ingredient.findMany({
      where: {
        approved: false,
        ...(search
          ? {
              nom: {
                contains: search,
                mode: 'insensitive',
              },
            }
          : {}),
      },
      include: {
        _count: {
          select: { recipes: true },
        },
        recipes: {
          include: {
            recipe: {
              select: {
                createdAt: true,
                user: {
                  select: {
                    nom: true,
                    pseudo: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        nom: 'asc',
      },
    });

    return res.json(ingredients.map(formatIngredient));
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la récupération des ingrédients admin.');
  }
}

export async function getAdminNotifications(req, res) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id,
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user.id,
        isRead: false,
      },
    });

    return res.json({
      unreadCount,
      notifications: notifications.map(formatNotification),
    });
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la récupération des notifications admin.');
  }
}

export async function updateIngredient(req, res) {
  try {
    const name = String(req.body.name || '').trim().toLowerCase();

    if (!name) {
      return res.status(400).json({ message: 'Le nom de l’ingrédient est requis.' });
    }

    const ingredient = await prisma.ingredient.update({
      where: { id: req.params.id },
      data: { nom: name },
      include: {
        _count: {
          select: { recipes: true },
        },
        recipes: {
          include: {
            recipe: {
              select: {
                createdAt: true,
                user: {
                  select: {
                    nom: true,
                    pseudo: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return res.json(formatIngredient(ingredient));
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la modification de l’ingrédient.');
  }
}

export async function approveIngredient(req, res) {
  try {
    const ingredient = await prisma.ingredient.update({
      where: { id: req.params.id },
      data: { approved: true },
      include: {
        _count: {
          select: { recipes: true },
        },
        recipes: {
          include: {
            recipe: {
              select: {
                createdAt: true,
                user: {
                  select: {
                    nom: true,
                    pseudo: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false,
        message: `Nouvel ingrédient soumis: ${ingredient.nom}`,
      },
      data: { isRead: true },
    });

    return res.json(formatIngredient(ingredient));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Ingrédient introuvable.' });
    }
    return sendError(res, error, 'Erreur lors de la validation de l’ingrédient.');
  }
}

export async function deleteIngredient(req, res) {
  try {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: req.params.id },
      select: { nom: true },
    });

    if (!ingredient) {
      return res.status(404).json({ message: 'Ingrédient introuvable.' });
    }

    await prisma.$transaction([
      prisma.recipeIngredient.deleteMany({ where: { ingredientId: req.params.id } }),
      prisma.ingredient.delete({ where: { id: req.params.id } }),
      prisma.notification.updateMany({
        where: {
          userId: req.user.id,
          isRead: false,
          message: `Nouvel ingrédient soumis: ${ingredient.nom}`,
        },
        data: { isRead: true },
      }),
    ]);

    return res.status(204).send();
  } catch (error) {
    return sendError(res, error, "Erreur lors de la suppression de l'ingrédient.");
  }
}


export const getAllRecipes = async (req, res) => {
  try {
    // Simulate fetching recipes from a database
    const recipes = [
      { id: 1, name: "Spaghetti Carbonara", ingredients: ["spaghetti", "eggs", "pancetta", "parmesan"] },
      { id: 2, name: "Chicken Curry", ingredients: ["chicken", "curry powder", "coconut milk"] },
      { id: 3, name: "Beef Stroganoff", ingredients: ["beef", "mushrooms", "sour cream"] },
    ];
    res.json(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
} ; 