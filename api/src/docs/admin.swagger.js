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
 *           example: /img/entrees.png
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

export {};
