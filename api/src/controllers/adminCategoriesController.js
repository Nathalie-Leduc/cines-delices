import { prisma } from '../lib/prisma.js';
import { formatCategory, formatRecipe, sendError } from './adminHelpers.js';

export async function getAdminCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { recipes: true } } },
      orderBy: { nom: 'asc' },
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
      data: { nom: name, ...(color && { color }) },
      include: { _count: { select: { recipes: true } } },
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
      include: { _count: { select: { recipes: true } } },
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
      include: { _count: { select: { recipes: true } } },
    });

    if (!category) {
      return res.status(404).json({ message: 'Catégorie introuvable.' });
    }

    const recipesCount = category._count?.recipes || 0;

    if (recipesCount > 0) {
      return res.status(409).json({
        message: `Impossible de supprimer cette catégorie : ${recipesCount} recette${recipesCount > 1 ? 's y sont associées' : ' y est associée'}.`,
      });
    }

    await prisma.category.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Catégorie introuvable.' });
    }
    return sendError(res, error, 'Erreur lors de la suppression de la catégorie.');
  }
}

export async function getCategoryRecipes(req, res) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { recipes: true } },
        recipes: {
          include: {
            category: true,
            media: true,
            user: { select: { nom: true, pseudo: true } },
            ingredients: { include: { ingredient: true } },
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ message: 'Catégorie introuvable.' });
    }

    const recipes = category.recipes
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(formatRecipe);

    return res.json({ category: formatCategory(category), recipes });
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la récupération des recettes liées à la catégorie.');
  }
}
