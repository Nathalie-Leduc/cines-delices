import { prisma } from '../lib/prisma.js';

export async function searchIngredients(req, res) {
  try {
    const query = String(req.query.q || req.query.searchTerm || '').trim().toLowerCase();

    if (query.length < 2) {
      return res.json([]);
    }

    const ingredients = await prisma.ingredient.findMany({
      where: {
        nom: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: {
        nom: 'asc',
      },
      take: 20,
    });

    return res.json(ingredients.map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.nom,
    })));
  } catch (error) {
    console.error('[searchIngredients]', error);
    return res.status(500).json({ message: 'Erreur lors de la recherche des ingrédients.' });
  }
}

export async function createIngredient(req, res) {
  try {
    const name = String(req.body?.name || req.body?.nom || '').trim().toLowerCase();

    if (!name) {
      return res.status(400).json({ message: 'Le nom de l\'ingrédient est requis.' });
    }

    const ingredient = await prisma.ingredient.upsert({
      where: { nom: name },
      update: {},
      create: { nom: name },
    });

    return res.status(201).json({
      id: ingredient.id,
      name: ingredient.nom,
    });
  } catch (error) {
    console.error('[createIngredient]', error);
    return res.status(500).json({ message: 'Erreur lors de la création de l\'ingrédient.' });
  }
}
