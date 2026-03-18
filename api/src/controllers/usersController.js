import { prisma } from '../prisma.js';

/**
 * Récupère toutes les recettes appartenant à l'utilisateur connecté.
 * 
 * @param {Object} req - Objet requête Express, contient req.user (défini par le middleware auth)
 * @param {Object} res - Objet réponse Express
 * 
 * @returns {Array} Liste des recettes avec relations (catégorie, média, ingrédients)
 * 
 * @example
 * GET /api/users/me/recipes
 * Headers: Authorization: Bearer <token>
 * Response: [{ id: '...', titre: '...', category: {...}, media: {...}, ingredients: [...] }]
 */
export async function getMyRecipes(req, res) {
	try {
		// Extraction de l'ID utilisateur depuis le token JWT (middleware requireAuth)
		const userId = req.user?.id;

		// Vérification que l'utilisateur est bien authentifié
		if (!userId) {
			return res.status(401).json({ message: 'Utilisateur non authentifié.' });
		}

		// Récupération de toutes les recettes de cet utilisateur depuis la BD
		const recipes = await prisma.recipe.findMany({
			where: { userId }, // Filtre : seulement les recettes de cet utilisateur
			orderBy: { createdAt: 'desc' }, // Tri : plus récentes en premier
			include: {
				// Inclure les relations complètes pour enrichir la réponse
				category: true, // Données de la catégorie (Entrée, Plat, etc.)
				media: true, // Données du film/série associé
				ingredients: {
					include: {
						ingredient: true, // Détail de chaque ingrédient
					},
				},
			},
		});

		// Renvoi des recettes au client
		return res.json(recipes);
	} catch (error) {
		// Gestion des erreurs (DB, Prisma, autres)
		console.error(error);
		return res.status(500).json({ message: 'Erreur serveur lors de la récupération des recettes utilisateur.' });
	}
}
