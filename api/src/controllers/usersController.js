import { prisma } from '../lib/prisma.js';

/**
 * Récupère le profil de l'utilisateur connecté (prénom, nom, email).
 *
 * @param {Object} req - Objet requête Express, contient req.user (défini par le middleware auth)
 * @param {Object} res - Objet réponse Express
 *
 * @example
 * GET /api/users/me
 * Headers: Authorization: Bearer <token>
 * Response: { id: '...', pseudo: '...', prenom: '...', email: '...' }
 */
export async function getMe(req, res) {
	try {
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ message: 'Utilisateur non authentifié.' });
		}

		// Récupère uniquement les champs nécessaires à l'affichage du profil
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				nom: true,
				pseudo: true,
				email: true,
			},
		});

		if (!user) {
			return res.status(404).json({ message: 'Utilisateur introuvable.' });
		}

		// Compat front: expose `prenom` using `pseudo` until dedicated first-name field exists.
		return res.json({
			id: user.id,
			nom: user.nom,
			email: user.email,
			pseudo: user.pseudo,
			prenom: user.pseudo,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: 'Erreur serveur lors de la récupération du profil.' });
	}
}

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

/**
 * Récupère les notifications de l'utilisateur connecté.
 *
 * @param {Object} req - Objet requête Express
 * @param {Object} res - Objet réponse Express
 */
export async function getMyNotifications(req, res) {
	try {
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ message: 'Utilisateur non authentifié.' });
		}

		const [notifications, unreadCount] = await Promise.all([
			prisma.notification.findMany({
				where: { userId },
				orderBy: { createdAt: 'desc' },
				take: 20,
				select: {
					id: true,
					type: true,
					message: true,
					isRead: true,
					recipeId: true,
					createdAt: true,
				},
			}),
			prisma.notification.count({
				where: {
					userId,
					isRead: false,
				},
			}),
		]);

		return res.json({ notifications, unreadCount });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: 'Erreur serveur lors de la récupération des notifications.' });
	}
}

/**
 * Supprime une notification de l'utilisateur connecté.
 *
 * @param {Object} req - Objet requête Express
 * @param {Object} res - Objet réponse Express
 */
export async function deleteMyNotification(req, res) {
	try {
		const userId = req.user?.id;
		const notificationId = String(req.params.id || '').trim();

		if (!userId) {
			return res.status(401).json({ message: 'Utilisateur non authentifié.' });
		}

		if (!notificationId) {
			return res.status(400).json({ message: 'Notification invalide.' });
		}

		const deleted = await prisma.notification.deleteMany({
			where: {
				id: notificationId,
				userId,
			},
		});

		if (deleted.count === 0) {
			return res.status(404).json({ message: 'Notification introuvable.' });
		}

		return res.status(204).send();
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: 'Erreur serveur lors de la suppression de la notification.' });
	}
}
