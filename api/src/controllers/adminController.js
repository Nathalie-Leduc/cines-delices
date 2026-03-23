import { prisma } from '../lib/prisma.js';

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

function formatRecipe(recipe) {
  const duration = [recipe.tempsPreparation, recipe.tempsCuisson]
    .filter((value) => Number.isFinite(value) && value > 0)
    .reduce((sum, value) => sum + value, 0);

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
  return {
    id: ingredient.id,
    name: ingredient.nom,
    recipesCount: ingredient._count?.recipes || 0,
  };
}

function sendError(res, error, fallbackMessage) {
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: fallbackMessage });
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
  req.query.status = 'PENDING';
  return getAdminRecipes(req, res);
}

export async function approveRecipe(req, res) {
  try {
    const updatedRecipe = await prisma.recipe.update({
      where: { id: req.params.id },
      data: {
        status: 'PUBLISHED',
        rejectionReason: null,
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

    return res.json(formatRecipe(updatedRecipe));
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la validation de la recette.');
  }
}

export async function rejectRecipe(req, res) {
  try {
    const rejectionReason = String(req.body.reason || '').trim();

    if (rejectionReason && rejectionReason.length < 10) {
      return res.status(400).json({ message: 'Motif trop court (min 10 caractères).' });
    }

    const updatedRecipe = await prisma.recipe.update({
      where: { id: req.params.id },
      data: {
        status: 'DRAFT',
        rejectionReason: rejectionReason || 'Recette refusée par la modération.',
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

    return res.json(formatRecipe(updatedRecipe));
  } catch (error) {
    return sendError(res, error, 'Erreur lors du refus de la recette.');
  }
}

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
    const { titre, instructions, nombrePersonnes, tempsPreparation, tempsCuisson, categoryId, categoryName, mediaId, tmdbId } = req.body;

    const data = {};
    if (titre !== undefined) data.titre = String(titre).trim();
    if (instructions !== undefined) data.instructions = String(instructions).trim();
    if (nombrePersonnes !== undefined) data.nombrePersonnes = nombrePersonnes ? parseInt(nombrePersonnes, 10) : null;
    if (tempsPreparation !== undefined) data.tempsPreparation = tempsPreparation ? parseInt(tempsPreparation, 10) : null;
    if (tempsCuisson !== undefined) data.tempsCuisson = tempsCuisson ? parseInt(tempsCuisson, 10) : null;

    // Résolution du média : par UUID direct ou par tmdbId
    if (tmdbId !== undefined && tmdbId !== null) {
      const media = await prisma.media.findUnique({ where: { tmdbId: parseInt(tmdbId, 10) } });
      if (!media) {
        return res.status(404).json({ message: 'Média introuvable en base. Veuillez choisir un film déjà présent.' });
      }
      data.mediaId = media.id;
    } else if (mediaId !== undefined && mediaId !== null) {
      data.mediaId = mediaId;
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

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'Aucun champ à modifier.' });
    }

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

    return res.json(formatRecipe(updated));
  } catch (error) {
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

    return res.json(users.map(formatUser));
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
    await prisma.category.delete({
      where: { id: req.params.id },
    });

    return res.status(204).send();
  } catch (error) {
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
      },
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
    await prisma.$transaction([
      prisma.recipeIngredient.deleteMany({ where: { ingredientId: req.params.id } }),
      prisma.ingredient.delete({ where: { id: req.params.id } }),
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