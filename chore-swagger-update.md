# Chore : Swagger — routes manquantes + suppression doublon

## Branche de travail

```bash
git checkout develop
git pull
git checkout -b chore/swagger-complete
```

---

## Étape 1 — Supprimer le doublon `api/src/swagger.js`

```bash
git rm api/src/swagger.js
```

---

## Étape 2 — Mettre à jour `api/src/swagger/swagger.js`

Remplacer le contenu entier par :

```js
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CinéDélices API',
      version: '1.0.0',
      description: "Documentation de l'API CinéDélices",
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Serveur de développement',
      },
    ],
  },
  apis: ['./src/docs/*.swagger.js'],
};

export const swaggerSpec = swaggerJSDoc(options);

function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

export default setupSwagger;
```

---

## Étape 3 — Mettre à jour `api/src/docs/validateSwaggerSpec.js`

Remplacer la ligne d'import :

```js
// AVANT
import { swaggerSpec } from '../swagger.js';

// APRÈS
import { swaggerSpec } from '../swagger/swagger.js';
```

---

## Étape 4 — Compléter `api/src/docs/admin.swagger.js`

Remplacer la ligne `export {};` à la fin du fichier par :

```js
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
```

---

## Étape 5 — Créer `api/src/docs/users.swagger.js`

```js
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
```

---

## Étape 6 — Créer `api/src/docs/ingredients.swagger.js`

```js
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
```

---

## Étape 7 — Créer `api/src/docs/categories.swagger.js`

```js
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
```

---

## Étape 8 — Créer `api/src/docs/media.swagger.js`

```js
/**
 * @openapi
 * tags:
 *   - name: Media
 *     description: Catalogue films et series associes aux recettes.
 * components:
 *   schemas:
 *     MediaItem:
 *       type: object
 *       required: [id, title, type]
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *           example: Matrix
 *         slug:
 *           type: string
 *           example: matrix-1999
 *         type:
 *           type: string
 *           enum: [MOVIE, SERIES]
 *           example: MOVIE
 *         year:
 *           type: string
 *           nullable: true
 *           example: '1999'
 *         posterUrl:
 *           type: string
 *           nullable: true
 *         director:
 *           type: string
 *           nullable: true
 *           example: Lana Wachowski
 *         synopsis:
 *           type: string
 *           nullable: true
 *         recipesCount:
 *           type: integer
 *           example: 4
 * paths:
 *   /api/media/movies:
 *     get:
 *       summary: Catalogue des films avec recettes publiees
 *       tags: [Media]
 *       responses:
 *         200:
 *           description: Liste des films.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/MediaItem'
 *   /api/media/movies/{slug}:
 *     get:
 *       summary: Detail d'un film par slug
 *       tags: [Media]
 *       parameters:
 *         - in: path
 *           name: slug
 *           required: true
 *           schema: { type: string }
 *           example: matrix-1999
 *       responses:
 *         200:
 *           description: Detail du film avec ses recettes.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/MediaItem'
 *         404:
 *           description: Film introuvable.
 *   /api/media/series:
 *     get:
 *       summary: Catalogue des series avec recettes publiees
 *       tags: [Media]
 *       responses:
 *         200:
 *           description: Liste des series.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/MediaItem'
 *   /api/media/series/{slug}:
 *     get:
 *       summary: Detail d'une serie par slug
 *       tags: [Media]
 *       parameters:
 *         - in: path
 *           name: slug
 *           required: true
 *           schema: { type: string }
 *           example: breaking-bad-2008
 *       responses:
 *         200:
 *           description: Detail de la serie avec ses recettes.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/MediaItem'
 *         404:
 *           description: Serie introuvable.
 */

export {};
```

---

## Étape 9 — Créer `api/src/docs/contact.swagger.js`

```js
/**
 * @openapi
 * tags:
 *   - name: Contact
 *     description: Formulaire de contact.
 * paths:
 *   /api/contact:
 *     post:
 *       summary: Envoyer un message de contact
 *       tags: [Contact]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [name, email, message]
 *               properties:
 *                 name:
 *                   type: string
 *                   example: Marie Dupont
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: marie@exemple.fr
 *                 message:
 *                   type: string
 *                   example: Bonjour, je souhaite signaler un probleme.
 *       responses:
 *         200:
 *           description: Message envoye avec succes.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: Message envoye avec succes.
 *         400:
 *           description: Donnees invalides.
 *         500:
 *           description: Erreur lors de l'envoi.
 */

export {};
```

---

## Commit

```bash
git rm api/src/swagger.js

git add \
  api/src/swagger/swagger.js \
  api/src/docs/validateSwaggerSpec.js \
  api/src/docs/admin.swagger.js \
  api/src/docs/users.swagger.js \
  api/src/docs/ingredients.swagger.js \
  api/src/docs/categories.swagger.js \
  api/src/docs/media.swagger.js \
  api/src/docs/contact.swagger.js

git commit -m "chore: complete swagger docs for all routes and remove duplicate swagger file"
```

## Push et PR

```bash
git push perso chore/swagger-complete
```

Ouvre une Pull Request vers `develop` sur GitHub.

---

## Vérification après merge

```bash
cd api
node src/docs/validateSwaggerSpec.js
# Doit afficher : Swagger spec valide (X paths, Y schemas).
```

Ou ouvrir http://localhost:3000/api-docs pour voir toutes les routes documentées.
