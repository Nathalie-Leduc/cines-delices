/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Pagination:
 *       type: object
 *       required:
 *         - page
 *         - limit
 *         - totalItems
 *         - totalPages
 *         - hasNextPage
 *         - hasPreviousPage
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 12
 *         totalItems:
 *           type: integer
 *           example: 42
 *         totalPages:
 *           type: integer
 *           example: 4
 *         hasNextPage:
 *           type: boolean
 *           example: true
 *         hasPreviousPage:
 *           type: boolean
 *           example: false
 *     Ingredient:
 *       type: object
 *       required:
 *         - id
 *         - nom
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: 5a4bd70c-3633-4f39-9ae9-c17e42b4b9d7
 *         nom:
 *           type: string
 *           example: chocolat noir
 *         approved:
 *           type: boolean
 *           nullable: true
 *           example: true
 *     RecipeIngredient:
 *       type: object
 *       required:
 *         - ingredient
 *       properties:
 *         quantity:
 *           type: string
 *           nullable: true
 *           example: 200
 *         unit:
 *           type: string
 *           nullable: true
 *           example: g
 *         ingredient:
 *           $ref: '#/components/schemas/Ingredient'
 *     RecipeCategory:
 *       type: object
 *       nullable: true
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: 7748ec7d-a6de-4b68-9b87-3c6c2e0042ad
 *         nom:
 *           type: string
 *           example: Dessert
 *     RecipeMedia:
 *       type: object
 *       nullable: true
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: 9271aeb2-e9cb-4d75-8c92-6305a4ec5192
 *         tmdbId:
 *           type: integer
 *           nullable: true
 *           example: 603
 *         titre:
 *           type: string
 *           example: Matrix
 *         slug:
 *           type: string
 *           example: matrix-2026
 *         type:
 *           type: string
 *           enum:
 *             - MOVIE
 *             - SERIES
 *           example: MOVIE
 *         posterUrl:
 *           type: string
 *           nullable: true
 *           example: https://image.tmdb.org/t/p/w500/demo.jpg
 *     RecipeAuthor:
 *       type: object
 *       nullable: true
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: 27273931-fd90-4a0e-9078-f4378c5888d9
 *         pseudo:
 *           type: string
 *           example: mariechef
 *         email:
 *           type: string
 *           format: email
 *           example: marie@cinesdelices.fr
 *     Recipe:
 *       type: object
 *       required:
 *         - id
 *         - titre
 *         - slug
 *         - instructions
 *         - status
 *         - createdAt
 *         - updatedAt
 *         - ingredients
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: c8ec108e-72ab-40be-af48-e1e86d612f26
 *         titre:
 *           type: string
 *           example: Brownie Matrix
 *         slug:
 *           type: string
 *           example: brownie-matrix
 *         imageURL:
 *           type: string
 *           nullable: true
 *           example: http://localhost:3000/uploads/recipe-demo.webp
 *         instructions:
 *           type: string
 *           example: Faire fondre le chocolat puis incorporer les oeufs.
 *         nombrePersonnes:
 *           type: integer
 *           nullable: true
 *           example: 4
 *         tempsPreparation:
 *           type: integer
 *           nullable: true
 *           example: 20
 *         tempsCuisson:
 *           type: integer
 *           nullable: true
 *           example: 25
 *         status:
 *           type: string
 *           enum:
 *             - DRAFT
 *             - PENDING
 *             - PUBLISHED
 *           example: PUBLISHED
 *         rejectionReason:
 *           type: string
 *           nullable: true
 *           example: Un ingredient refuse doit etre remplace.
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         category:
 *           $ref: '#/components/schemas/RecipeCategory'
 *         media:
 *           $ref: '#/components/schemas/RecipeMedia'
 *         user:
 *           $ref: '#/components/schemas/RecipeAuthor'
 *         ingredients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RecipeIngredient'
 *     RecipeListResponse:
 *       type: object
 *       required:
 *         - recipes
 *         - pagination
 *       properties:
 *         recipes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Recipe'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *     RecipeMutationResponse:
 *       type: object
 *       required:
 *         - message
 *         - recipe
 *       properties:
 *         message:
 *           type: string
 *           example: Recette mise a jour
 *         recipe:
 *           $ref: '#/components/schemas/Recipe'
 *     DeleteRecipeResponse:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           example: Recette supprimee
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Recette introuvable
 *         error:
 *           type: string
 *           example: Route non trouvee
 *     RecipePayload:
 *       type: object
 *       required:
 *         - titre
 *       properties:
 *         titre:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: Brownie Matrix
 *         instructions:
 *           type: string
 *           description: Texte complet des instructions. Obligatoire si etapes n'est pas fourni.
 *           example: Faire fondre le chocolat puis cuire 25 minutes.
 *         etapes:
 *           type: array
 *           description: Liste d'etapes. En multipart, envoyer une chaine JSON.
 *           items:
 *             type: string
 *           example:
 *             - Faire fondre le chocolat
 *             - Ajouter les oeufs
 *             - Cuire 25 minutes
 *         categoryId:
 *           type: string
 *           format: uuid
 *           description: Identifiant d'une categorie existante.
 *         categorie:
 *           type: string
 *           description: Nom de categorie a reutiliser ou creer.
 *           example: Dessert
 *         mediaId:
 *           type: string
 *           format: uuid
 *           description: Identifiant d'un media existant.
 *         filmId:
 *           type: integer
 *           description: Identifiant TMDB si mediaId n'est pas fourni.
 *           example: 603
 *         film:
 *           type: string
 *           description: Titre du media si filmId est fourni.
 *           example: Matrix
 *         type:
 *           type: string
 *           description: Type du media si filmId est fourni.
 *           enum:
 *             - F
 *             - S
 *             - movie
 *             - tv
 *             - series
 *           example: movie
 *         nombrePersonnes:
 *           type: integer
 *           example: 4
 *         nbPersonnes:
 *           type: integer
 *           description: Alias accepte pour nombrePersonnes.
 *           example: 4
 *         tempsPreparation:
 *           type: integer
 *           example: 20
 *         tempsCuisson:
 *           type: integer
 *           example: 25
 *         image:
 *           type: string
 *           format: binary
 *           description: Image optionnelle de la recette.
 *         imageUrl:
 *           type: string
 *           format: uri
 *           description: URL renseignee automatiquement apres upload ou envoyee directement.
 *           example: http://localhost:3000/uploads/recipe-demo.webp
 *         ingredients:
 *           type: array
 *           description: Liste des ingredients. En multipart, envoyer une chaine JSON.
 *           items:
 *             type: object
 *             required:
 *               - nom
 *             properties:
 *               nom:
 *                 type: string
 *                 example: chocolat noir
 *               quantity:
 *                 anyOf:
 *                   - type: string
 *                   - type: number
 *                 nullable: true
 *                 example: 200
 *               quantite:
 *                 anyOf:
 *                   - type: string
 *                   - type: number
 *                 nullable: true
 *                 example: 200
 *               unit:
 *                 type: string
 *                 nullable: true
 *                 example: g
 *               unite:
 *                 type: string
 *                 nullable: true
 *                 example: g
 * paths:
 *   /api/recipes:
 *     get:
 *       summary: Lister les recettes publiees
 *       tags:
 *         - Recipes
 *       parameters:
 *         - in: query
 *           name: page
 *           schema:
 *             type: integer
 *             minimum: 1
 *             default: 1
 *         - in: query
 *           name: limit
 *           schema:
 *             type: integer
 *             minimum: 1
 *             maximum: 50
 *             default: 12
 *         - in: query
 *           name: category
 *           schema:
 *             type: string
 *           description: ID ou nom de categorie.
 *         - in: query
 *           name: q
 *           schema:
 *             type: string
 *           description: Recherche sur le titre, la categorie ou le media.
 *       responses:
 *         200:
 *           description: Liste paginee des recettes publiees.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/RecipeListResponse'
 *         500:
 *           description: Erreur serveur.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *     post:
 *       summary: Creer une recette
 *       tags:
 *         - Recipes
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecipePayload'
 *           multipart/form-data:
 *             schema:
 *               $ref: '#/components/schemas/RecipePayload'
 *       responses:
 *         201:
 *           description: Recette creee et envoyee en validation.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/RecipeMutationResponse'
 *         400:
 *           description: Donnees invalides.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Utilisateur non authentifie.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         404:
 *           description: Categorie ou media introuvable.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         500:
 *           description: Erreur serveur.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *   /api/recipes/mine:
 *     get:
 *       summary: Lister les recettes de l'utilisateur connecte
 *       tags:
 *         - Recipes
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Liste des recettes du membre connecte.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Recipe'
 *         401:
 *           description: Utilisateur non authentifie.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *   /api/recipes/{id}:
 *     get:
 *       summary: Recuperer une recette par id ou slug
 *       tags:
 *         - Recipes
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: ID UUID ou slug de la recette.
 *       responses:
 *         200:
 *           description: Recette trouvee.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Recipe'
 *         404:
 *           description: Recette introuvable.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         500:
 *           description: Erreur serveur.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *     patch:
 *       summary: Mettre a jour une recette
 *       tags:
 *         - Recipes
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: ID UUID ou slug de la recette.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecipePayload'
 *           multipart/form-data:
 *             schema:
 *               $ref: '#/components/schemas/RecipePayload'
 *       responses:
 *         200:
 *           description: Recette mise a jour.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/RecipeMutationResponse'
 *         401:
 *           description: Utilisateur non authentifie.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         403:
 *           description: Modification non autorisee.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         404:
 *           description: Recette, categorie ou media introuvable.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         500:
 *           description: Erreur serveur.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *     delete:
 *       summary: Supprimer une recette
 *       tags:
 *         - Recipes
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: ID UUID ou slug de la recette.
 *       responses:
 *         200:
 *           description: Recette supprimee.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/DeleteRecipeResponse'
 *         401:
 *           description: Utilisateur non authentifie.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         403:
 *           description: Suppression non autorisee.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         404:
 *           description: Recette introuvable.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         500:
 *           description: Erreur serveur.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *   /api/recipes/{id}/submit:
 *     patch:
 *       summary: Soumettre une recette en attente de validation admin
 *       tags:
 *         - Recipes
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *           description: ID UUID de la recette a soumettre.
 *       responses:
 *         200:
 *           description: Recette soumise pour validation.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/RecipeMutationResponse'
 *         400:
 *           description: La recette est deja en attente ou n'est pas un brouillon.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         401:
 *           description: Utilisateur non authentifie.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         403:
 *           description: Soumission non autorisee.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         404:
 *           description: Recette introuvable.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 */

export {};
