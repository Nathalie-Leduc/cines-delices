/**
 * @openapi
 * tags:
 *   - name: Ingredients
 *     description: Recherche et creation d'ingredients (membres).
 * components:
 *   schemas:
 *     IngredientSearchResult:
 *       type: object
 *       required: [id, name]
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: chocolat noir
 *         approved:
 *           type: boolean
 *           example: true
 * paths:
 *   /api/ingredients/search:
 *     get:
 *       summary: Rechercher des ingredients valides
 *       tags: [Ingredients]
 *       parameters:
 *         - in: query
 *           name: q
 *           required: true
 *           schema: { type: string }
 *           description: Terme de recherche (min 2 caracteres).
 *           example: choc
 *       responses:
 *         200:
 *           description: Liste des ingredients correspondants.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/IngredientSearchResult'
 *         400:
 *           description: Terme de recherche manquant ou trop court.
 *   /api/ingredients:
 *     post:
 *       summary: Soumettre un nouvel ingredient (membre)
 *       tags: [Ingredients]
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
 *           description: Ingredient soumis en attente de validation admin.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/IngredientSearchResult'
 *         400:
 *           description: Nom manquant ou invalide.
 *         401:
 *           description: Non authentifie.
 */

export {};
