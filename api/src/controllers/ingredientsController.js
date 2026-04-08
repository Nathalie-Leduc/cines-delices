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

//normalisation des ingrédients au singulier pour éviter par exemple citron et citrons dans la liste des ingrédients et dans la BDD
function normalizeIngredientName(name) {
  const str = String(name || '').trim().toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // CORRECTIF — noms composés (avec espace) : pas de singularisation.
  // "fraise des bois" → "fraise des bois" ✅ (était "fraise des boi" ❌)
  // "fraises"         → "fraise"          ✅ (inchangé)
  if (str.includes(' ')) return str;

  const exceptions = new Set([
    'riz', 'noix', 'ananas', 'brocolis', 'radis', 'mais', 'pois',
    'fois', 'buis', 'tapas', 'papas', 'colis',
  ]);

  if (exceptions.has(str)) return str;
  if (str.endsWith('s') && str.length > 3) return str.slice(0, -1);
  return str;
}


export async function createIngredient(req, res) {
  try {
    const name = normalizeIngredientName(req.body?.name || req.body?.nom || '');

    if (!name) {
      return res.status(400).json({ message: 'Le nom de l\'ingrédient est requis.' });
    }

    const existingIngredient = await prisma.ingredient.findUnique({ where: { nom: name } });

    if (existingIngredient) {
      return res.status(200).json({
        id: existingIngredient.id,
        name: existingIngredient.nom,
      });
    }

    const ingredient = await prisma.ingredient.create({
      data: { nom: name },
    });

    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    if (adminUsers.length > 0) {
      await prisma.notification.createMany({
        data: adminUsers.map((admin) => ({
          type: 'RECIPE_SUBMITTED',
          message: `Nouvel ingrédient soumis: ${ingredient.nom}`,
          userId: admin.id,
          recipeId: null,
        })),
      });
    }

    return res.status(201).json({
      id: ingredient.id,
      name: ingredient.nom,
    });
  } catch (error) {
    console.error('[createIngredient]', error);
    return res.status(500).json({ message: 'Erreur lors de la création de l\'ingrédient.' });
  }
}
