/**
 * @openapi
 * tags:
 *   - name: Admin - Recipes
 *     description: Moderation des recettes cote administration.
 *   - name: Admin - Users
 *     description: Gestion des utilisateurs cote administration.
 * components:
 *   schemas:
 *     AdminErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Recette introuvable.
 *         error:
 *           type: string
 *           example: Acces reserve aux administrateurs
 *     AdminSubmittedBy:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - fullName
 *       properties:
 *         firstName:
 *           type: string
 *           example: Marie
 *         lastName:
 *           type: string
 *           example: Dupont
 *         fullName:
 *           type: string
 *           example: Marie Dupont
 *     AdminRecipeIngredient:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - quantity
 *         - unit
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: chocolat noir
 *         quantity:
 *           type: string
 *           example: 200
 *         unit:
 *           type: string
 *           example: g
 *     AdminRecipe:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - slug
 *         - category
 *         - movie
 *         - duration
 *         - media
 *         - status
 *         - submittedBy
 *         - submittedByLabel
 *         - ingredients
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *           example: Brownie Matrix
 *         slug:
 *           type: string
 *           example: brownie-matrix
 *         category:
 *           type: string
 *           example: Dessert
 *         categoryId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         movie:
 *           type: string
 *           example: Matrix
 *         movieId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         duration:
 *           type: string
 *           example: 45 min
 *         media:
 *           type: string
 *           enum: [F, S]
 *           example: F
 *         image:
 *           type: string
 *           example: /img/entrees.webp
 *         mediaPoster:
 *           type: string
 *           nullable: true
 *           example: https://image.tmdb.org/t/p/w500/abc.jpg
 *         status:
 *           type: string
 *           enum: [DRAFT, PENDING, PUBLISHED]
 *           example: PENDING
 *         instructions:
 *           type: string
 *         people:
 *           type: integer
 *           example: 4
 *         preparationTime:
 *           type: integer
 *           example: 20
 *         cookingTime:
 *           type: integer
 *           example: 25
 *         rejectionReason:
 *           type: string
 *           example: Ingredient non autorise.
 *         submittedBy:
 *           $ref: '#/components/schemas/AdminSubmittedBy'
 *         submittedByLabel:
 *           type: string
 *           example: Marie Dupont
 *         ingredients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdminRecipeIngredient'
 *     AdminRejectRecipePayload:
 *       type: object
 *       required:
 *         - rejectionReason
 *       properties:
 *         rejectionReason:
 *           type: string
 *           minLength: 10
 *           example: Le motif de refus est detaille ici.
 *     AdminUser:
 *       type: object
 *       required:
 *         - id
 *         - nom
 *         - displayName
 *         - prenom
 *         - email
 *         - role
 *         - totalRecipes
 *         - recipeCounts
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nom:
 *           type: string
 *           example: MARIE
 *         displayName:
 *           type: string
 *           example: marie
 *         prenom:
 *           type: string
 *           example: marie
 *         email:
 *           type: string
 *           format: email
 *           example: marie@cinesdelices.fr
 *         role:
 *           type: string
 *           enum: [ADMIN, MEMBER]
 *         totalRecipes:
 *           type: integer
 *           example: 8
 *         recipeCounts:
 *           type: object
 *           required:
 *             - entree
 *             - plat
 *             - dessert
 *             - boisson
 *           properties:
 *             entree:
 *               type: integer
 *               example: 2
 *             plat:
 *               type: integer
 *               example: 3
 *             dessert:
 *               type: integer
 *               example: 2
 *             boisson:
 *               type: integer
 *               example: 1
 * paths:
 *   /api/admin/recipes/pending:
 *     get:
 *       summary: Lister les recettes en attente de moderation
 *       tags:
 *         - Admin - Recipes
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Liste des recettes en attente.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/AdminRecipe'
 *         401:
 *           description: Token manquant, invalide ou expire.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminErrorResponse'
 *         403:
 *           description: Acces reserve aux administrateurs.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminErrorResponse'
 *         500:
 *           description: Erreur serveur.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminErrorResponse'
 *   /api/admin/recipes/{id}/publish:
 *     patch:
 *       summary: Publier une recette en attente
 *       tags:
 *         - Admin - Recipes
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *           description: ID UUID de la recette.
 *       responses:
 *         200:
 *           description: Recette publiee.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminRecipe'
 *         401:
 *           description: Token manquant, invalide ou expire.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminErrorResponse'
 *         403:
 *           description: Acces reserve aux administrateurs.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminErrorResponse'
 *         404:
 *           description: Recette introuvable.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminErrorResponse'
 *         409:
 *           description: Recette non publiable dans son etat actuel.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminErrorResponse'
 *         500:
 *           description: Erreur serveur.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminErrorResponse'
 *   /api/admin/recipes/{id}/reject:
 *     patch:
 *       summary: Refuser une recette avec motif
 *       tags:
 *         - Admin - Recipes
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *           description: ID UUID de la recette.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminRejectRecipePayload'
 *       responses:
 *         200:
 *           description: Recette refusee.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminRecipe'
 *         400:
 *           description: Motif de refus invalide.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminErrorResponse'
 *         401:
 *           description: Token manquant, invalide ou expire.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminErrorResponse'
 *         403:
 *           description: Acces reserve aux administrateurs.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminErrorResponse'
 *         404:
 *           description: Recette introuvable.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminErrorResponse'
 *         500:
 *           description: Erreur serveur.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminErrorResponse'
 *   /api/admin/users:
 *     get:
 *       summary: Lister les utilisateurs cote admin
 *       tags:
 *         - Admin - Users
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: search
 *           schema:
 *             type: string
 *           description: Recherche sur pseudo ou email.
 *       responses:
 *         200:
 *           description: Liste des utilisateurs avec compteurs de recettes.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/AdminUser'
 *         401:
 *           description: Token manquant, invalide ou expire.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminErrorResponse'
 *         403:
 *           description: Acces reserve aux administrateurs.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminErrorResponse'
 *         500:
 *           description: Erreur serveur.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminErrorResponse'
 */

/**
 * @openapi
 * tags:
 *   - name: Admin - Categories
 *     description: Gestion des categories cote administration.
 *   - name: Admin - Ingredients
 *     description: Gestion des ingredients cote administration.
 *   - name: Admin - Notifications
 *     description: Notifications administrateur.
 * components:
 *   schemas:
 *     AdminCategory:
 *       type: object
 *       required: [id, name]
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: Dessert
 *     AdminIngredient:
 *       type: object
 *       required: [id, name, approved]
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: chocolat noir
 *         approved:
 *           type: boolean
 *           example: false
 *         recipesCount:
 *           type: integer
 *           example: 3
 *     AdminNotification:
 *       type: object
 *       required: [id, message, createdAt, isRead]
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         message:
 *           type: string
 *           example: Nouvelle recette soumise par Marie Dupont
 *         createdAt:
 *           type: string
 *           format: date-time
 *         isRead:
 *           type: boolean
 *           example: false
 *         recipeId:
 *           type: string
 *           format: uuid
 *           nullable: true
 * paths:
 *   /api/admin/recipes:
 *     get:
 *       summary: Lister toutes les recettes publiees (admin)
 *       tags: [Admin - Recipes]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: search
 *           schema: { type: string }
 *           description: Recherche sur le titre.
 *         - in: query
 *           name: category
 *           schema: { type: string }
 *           description: Filtrer par categorie.
 *         - in: query
 *           name: status
 *           schema: { type: string, enum: [DRAFT, PENDING, PUBLISHED] }
 *       responses:
 *         200:
 *           description: Liste des recettes.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/AdminRecipe'
 *         401:
 *           $ref: '#/components/schemas/AdminErrorResponse'
 *         403:
 *           $ref: '#/components/schemas/AdminErrorResponse'
 *   /api/admin/recipes/{id}:
 *     patch:
 *       summary: Modifier une recette (admin)
 *       tags: [Admin - Recipes]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema: { type: string, format: uuid }
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminRecipe'
 *           multipart/form-data:
 *             schema:
 *               $ref: '#/components/schemas/AdminRecipe'
 *       responses:
 *         200:
 *           description: Recette modifiee.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminRecipe'
 *         400:
 *           description: Donnees invalides.
 *         401:
 *           description: Non authentifie.
 *         403:
 *           description: Acces refuse.
 *         404:
 *           description: Recette introuvable.
 *     delete:
 *       summary: Supprimer une recette et notifier le membre
 *       tags: [Admin - Recipes]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema: { type: string, format: uuid }
 *       requestBody:
 *         required: false
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifMessage:
 *                   type: string
 *                   description: Message optionnel envoye au membre.
 *                   example: Votre recette a ete supprimee car elle ne respecte pas nos regles.
 *       responses:
 *         204:
 *           description: Recette supprimee. Le membre a ete notifie.
 *         401:
 *           description: Non authentifie.
 *         403:
 *           description: Acces refuse.
 *         404:
 *           description: Recette introuvable.
 *   /api/admin/users/{id}/role:
 *     patch:
 *       summary: Modifier le role d'un utilisateur
 *       tags: [Admin - Users]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema: { type: string, format: uuid }
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [role]
 *               properties:
 *                 role:
 *                   type: string
 *                   enum: [ADMIN, MEMBER]
 *                   example: ADMIN
 *       responses:
 *         200:
 *           description: Role mis a jour.
 *         401:
 *           description: Non authentifie.
 *         403:
 *           description: Acces refuse.
 *         404:
 *           description: Utilisateur introuvable.
 *   /api/admin/users/{id}/recipes:
 *     get:
 *       summary: Recettes d'un membre (admin)
 *       tags: [Admin - Users]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema: { type: string, format: uuid }
 *       responses:
 *         200:
 *           description: Liste des recettes du membre.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/AdminRecipe'
 *         401:
 *           description: Non authentifie.
 *         403:
 *           description: Acces refuse.
 *   /api/admin/users/{id}:
 *     delete:
 *       summary: Supprimer un utilisateur
 *       tags: [Admin - Users]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema: { type: string, format: uuid }
 *       responses:
 *         204:
 *           description: Utilisateur supprime.
 *         401:
 *           description: Non authentifie.
 *         403:
 *           description: Acces refuse.
 *         404:
 *           description: Utilisateur introuvable.
 *   /api/admin/notifications:
 *     get:
 *       summary: Lister les notifications admin
 *       tags: [Admin - Notifications]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: limit
 *           schema: { type: integer, default: 20 }
 *       responses:
 *         200:
 *           description: Liste des notifications avec compteur non lues.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   notifications:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/AdminNotification'
 *                   unreadCount:
 *                     type: integer
 *                     example: 3
 *         401:
 *           description: Non authentifie.
 *         403:
 *           description: Acces refuse.
 *   /api/admin/notifications/{id}:
 *     delete:
 *       summary: Supprimer une notification admin
 *       tags: [Admin - Notifications]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema: { type: string, format: uuid }
 *       responses:
 *         204:
 *           description: Notification supprimee.
 *         401:
 *           description: Non authentifie.
 *         403:
 *           description: Acces refuse.
 *         404:
 *           description: Notification introuvable.
 *   /api/admin/categories:
 *     get:
 *       summary: Lister les categories (admin)
 *       tags: [Admin - Categories]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Liste des categories.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/AdminCategory'
 *         401:
 *           description: Non authentifie.
 *         403:
 *           description: Acces refuse.
 *     post:
 *       summary: Creer une categorie
 *       tags: [Admin - Categories]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [name]
 *               properties:
 *                 name:
 *                   type: string
 *                   example: Boisson
 *       responses:
 *         201:
 *           description: Categorie creee.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminCategory'
 *         400:
 *           description: Donnees invalides.
 *         401:
 *           description: Non authentifie.
 *         403:
 *           description: Acces refuse.
 *   /api/admin/categories/{id}:
 *     patch:
 *       summary: Modifier une categorie
 *       tags: [Admin - Categories]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema: { type: string, format: uuid }
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: Entree
 *       responses:
 *         200:
 *           description: Categorie modifiee.
 *         404:
 *           description: Categorie introuvable.
 *     delete:
 *       summary: Supprimer une categorie
 *       tags: [Admin - Categories]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema: { type: string, format: uuid }
 *       responses:
 *         204:
 *           description: Categorie supprimee.
 *         404:
 *           description: Categorie introuvable.
 *   /api/admin/categories/{id}/recipes:
 *     get:
 *       summary: Recettes d'une categorie (admin)
 *       tags: [Admin - Categories]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema: { type: string, format: uuid }
 *       responses:
 *         200:
 *           description: Liste des recettes de la categorie.
 *   /api/admin/ingredients:
 *     get:
 *       summary: Lister les ingredients en attente de validation
 *       tags: [Admin - Ingredients]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Liste des ingredients non approuves.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/AdminIngredient'
 *     post:
 *       summary: Creer un ingredient directement approuve
 *       tags: [Admin - Ingredients]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [name]
 *               properties:
 *                 name:
 *                   type: string
 *                   example: fraise des bois
 *       responses:
 *         201:
 *           description: Ingredient cree et approuve.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AdminIngredient'
 *         200:
 *           description: Ingredient existant approuve.
 *         400:
 *           description: Nom manquant.
 *   /api/admin/ingredients/validated:
 *     get:
 *       summary: Lister les ingredients deja valides
 *       tags: [Admin - Ingredients]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: search
 *           schema: { type: string }
 *           description: Recherche sur le nom.
 *       responses:
 *         200:
 *           description: Liste des ingredients approuves.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/AdminIngredient'
 *   /api/admin/ingredients/merge:
 *     post:
 *       summary: Fusionner deux ingredients (doublon)
 *       tags: [Admin - Ingredients]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [sourceId, targetId]
 *               properties:
 *                 sourceId:
 *                   type: string
 *                   format: uuid
 *                   description: Ingredient a absorber (le doublon).
 *                 targetId:
 *                   type: string
 *                   format: uuid
 *                   description: Ingredient cible qui survit.
 *       responses:
 *         200:
 *           description: Fusion effectuee, ingredient source supprime.
 *         400:
 *           description: IDs manquants ou identiques.
 *         404:
 *           description: Un des ingredients introuvable.
 *   /api/admin/ingredients/{id}:
 *     patch:
 *       summary: Modifier un ingredient
 *       tags: [Admin - Ingredients]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema: { type: string, format: uuid }
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: fraise
 *       responses:
 *         200:
 *           description: Ingredient modifie.
 *         404:
 *           description: Ingredient introuvable.
 *     delete:
 *       summary: Refuser et supprimer un ingredient
 *       tags: [Admin - Ingredients]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema: { type: string, format: uuid }
 *       requestBody:
 *         required: false
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rejectionReason:
 *                   type: string
 *                   description: Message de refus envoye au membre.
 *                   example: Cet ingredient existe deja sous le nom fraise.
 *       responses:
 *         204:
 *           description: Ingredient supprime, membre notifie.
 *         409:
 *           description: Ingredient approuve utilise dans des recettes.
 *         404:
 *           description: Ingredient introuvable.
 *   /api/admin/ingredients/{id}/approve:
 *     patch:
 *       summary: Approuver un ingredient
 *       tags: [Admin - Ingredients]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema: { type: string, format: uuid }
 *       responses:
 *         200:
 *           description: Ingredient approuve.
 *         404:
 *           description: Ingredient introuvable.
 *   /api/admin/ingredients/{id}/recipes:
 *     get:
 *       summary: Recettes utilisant un ingredient (admin)
 *       tags: [Admin - Ingredients]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema: { type: string, format: uuid }
 *       responses:
 *         200:
 *           description: Liste des recettes utilisant cet ingredient.
 */

export {};

