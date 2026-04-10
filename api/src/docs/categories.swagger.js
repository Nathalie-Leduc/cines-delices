/**
 * @openapi
 * tags:
 *   - name: Categories
 *     description: Categories de recettes (lecture publique, ecriture admin).
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required: [id, name]
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: Dessert
 * paths:
 *   /api/categories:
 *     get:
 *       summary: Lister toutes les categories
 *       tags: [Categories]
 *       responses:
 *         200:
 *           description: Liste des categories disponibles.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Category'
 *     post:
 *       summary: Creer une categorie (admin)
 *       tags: [Categories]
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
 *         400:
 *           description: Nom manquant.
 *         401:
 *           description: Non authentifie.
 *         403:
 *           description: Acces refuse.
 *   /api/categories/{id}:
 *     patch:
 *       summary: Modifier une categorie (admin)
 *       tags: [Categories]
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
 *       summary: Supprimer une categorie (admin)
 *       tags: [Categories]
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
 */

export {};
