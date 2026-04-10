/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: Espace membre — profil et recettes personnelles.
 * components:
 *   schemas:
 *     MemberNotification:
 *       type: object
 *       required: [id, message, createdAt, isRead]
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         message:
 *           type: string
 *           example: Votre recette Brownie Matrix a ete validee.
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
 *   /api/users/me:
 *     get:
 *       summary: Recuperer le profil du membre connecte
 *       tags: [Users]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Profil du membre.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AuthUser'
 *         401:
 *           description: Non authentifie.
 *   /api/users/me/recipes:
 *     get:
 *       summary: Recettes du membre connecte
 *       tags: [Users]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Liste des recettes du membre (tous statuts).
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Recipe'
 *         401:
 *           description: Non authentifie.
 *   /api/users/me/notifications:
 *     get:
 *       summary: Notifications du membre connecte
 *       tags: [Users]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Liste des notifications du membre.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/MemberNotification'
 *         401:
 *           description: Non authentifie.
 *   /api/users/me/notifications/{id}:
 *     delete:
 *       summary: Supprimer une notification du membre
 *       tags: [Users]
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
 *         404:
 *           description: Notification introuvable.
 */

export {};
