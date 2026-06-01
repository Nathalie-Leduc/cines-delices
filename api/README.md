# 🎬 Cinés Délices — API

API REST de Cinés Délices : le moteur qui alimente le catalogue de recettes inspirées du cinéma.

---

## Stack

- Node.js >= 24 (ESM)
- Express 5
- Prisma 7 + PostgreSQL
- JWT + Argon2
- Zod (validation)
- Swagger (documentation auto)
- Nodemailer (emails)
- Sharp (conversion et compression WebP)

---

## Prérequis

- Node.js >= 24
- PostgreSQL (local ou hébergé)
- Clé API TMDB : https://www.themoviedb.org/settings/api

---

## Installation

```bash
cd api
cp .env.example .env
# Remplir les variables dans .env
pnpm install
```

---

## Variables d'environnement

| Variable         | Description                      | Exemple                                      |
|------------------|----------------------------------|----------------------------------------------|
| `PORT`           | Port du serveur                  | `3000`                                       |
| `DATABASE_URL`   | URL PostgreSQL                   | `postgresql://user:pass@localhost:5432/db`   |
| `JWT_SECRET`     | Clé secrète JWT                  | chaîne aléatoire 64 hex                      |
| `JWT_EXPIRES_IN` | Durée du token                   | `7h`                                         |
| `SWAGGER_API_KEY` | Clé Swagger                     | —                                            |
| `TMDB_API_KEY`   | Clé API TMDB                     | —                                            |
| `TMDB_BASE_URL`  | URL base TMDB                    | `https://api.themoviedb.org/3`               |
| `CLIENT_URL`     | URL du front (CORS)              | `http://localhost:5173`                      |
| `API_BASE_URL`   | URL publique du back             | `http://localhost:3000`                      |
| `SMTP_HOST`      | Hôte SMTP                        | `sandbox.smtp.mailtrap.io`                   |
| `SMTP_PORT`      | Port SMTP                        | `587`                                        |
| `SMTP_USER`      | Utilisateur SMTP                 | —                                            |
| `SMTP_PASS`      | Mot de passe SMTP                | —                                            |
| `SMTP_FROM`      | Expéditeur email                 | `Cinés Délices <noreply@...>`                 |

Générer un JWT_SECRET solide :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Scripts

| Commande                  | Action                                           |
|---------------------------|--------------------------------------------------|
| `pnpm run dev`            | Serveur en développement (nodemon)               |
| `pnpm run start`          | Serveur en production                            |
| `pnpm run lint`           | Lint ESLint                                      |
| `pnpm run db:generate`    | Génère le Prisma Client                          |
| `pnpm run db:migrate`     | Crée et applique une migration                   |
| `pnpm run db:push`        | Synchronise le schéma (sans migration)           |
| `pnpm run db:seed`        | Injecte les données de seed                      |
| `pnpm run db:reset`       | Reset complet + seed                             |
| `pnpm run db:studio`      | Ouvre Prisma Studio (http://localhost:5555)      |
| `pnpm run test`           | Tests d'intégration (test-api.js)                |
| `pnpm run test:security`  | Tests sécurité, JWT, RGPD, ingrédients           |
| `pnpm run test:all`       | Les deux suites de tests à la suite              |
| `pnpm run convert:images` | Convertit les images uploadées en WebP           |
| `pnpm run convert:posters`| Convertit les posters TMDB en WebP               |
| `pnpm run fix:media`      | Corrige les métadonnées médias manquantes        |

Les tests d'intégration nécessitent `API_BASE_URL` pointant vers une API démarrée.
Les scripts `test`, `test:security` et `test:all` utilisent automatiquement Railway.

---

## Routes principales

Base URL : `http://localhost:3000/api`

| Méthode | Route                          | Description                    | Auth       |
|---------|--------------------------------|--------------------------------|------------|
| GET     | `/health`                      | Vérification serveur           | —          |
| POST    | `/auth/register`               | Inscription                    | —          |
| POST    | `/auth/login`                  | Connexion                      | —          |
| GET     | `/auth/me`                     | Profil connecté                | JWT        |
| PATCH   | `/auth/me`                     | Modifier profil                | JWT        |
| DELETE  | `/auth/me`                     | Supprimer compte (RGPD)        | JWT        |
| GET     | `/recipes`                     | Catalogue recettes publiées    | —          |
| POST    | `/recipes`                     | Créer une recette              | JWT        |
| GET     | `/recipes/:slug`               | Détail d'une recette           | —          |
| PATCH   | `/recipes/:id`                 | Modifier une recette           | JWT        |
| DELETE  | `/recipes/:id`                 | Supprimer une recette          | JWT        |
| GET     | `/users/me/recipes`            | Recettes du membre connecté    | JWT        |
| GET     | `/categories`                  | Liste des catégories           | —          |
| GET     | `/ingredients/search`          | Rechercher un ingrédient       | —          |
| POST    | `/ingredients`                 | Créer un ingrédient            | JWT        |
| GET     | `/tmdb/medias/search`          | Rechercher un film/série       | —          |
| GET     | `/admin/recipes`               | Toutes les recettes (admin)    | JWT Admin  |
| GET     | `/admin/recipes/pending`       | Recettes en attente            | JWT Admin  |
| PATCH   | `/admin/recipes/:id/publish`   | Valider une recette            | JWT Admin  |
| PATCH   | `/admin/recipes/:id/reject`    | Refuser une recette            | JWT Admin  |
| DELETE  | `/admin/recipes/:id`           | Supprimer une recette          | JWT Admin  |

Documentation complète : **https://cines-delicesapi-production.up.railway.app/api/docs?key=SWAGGER_API_KEY** (Swagger — protégé par clé en production)
Pour tester l'API via Swagger : accéder à l'URL Swagger avec la clé fournie → 
`POST /api/auth/login` avec ces identifiants → copier le `token` de la réponse → 
cliquer sur **Authorize** (cadenas en haut à droite) → coller le token dans 
`bearerAuth` → tester les routes protégées.
---

## Base de données

### Premier lancement

```bash
pnpm run db:generate
pnpm run db:push
pnpm run db:seed
```

### Prisma Studio (interface visuelle)

```bash
pnpm run db:studio
# Ouvre http://localhost:5555
```

---

## Architecture

```
api/src/
├── app.js                        # Point d'entrée Express
├── controllers/                  # Logique métier
│   ├── authController.js         # Inscription, connexion, profil
│   ├── recipesController.js      # CRUD recettes + ingrédients
│   ├── ingredientsController.js  # Recherche + création (avec singularisation)
│   ├── adminRecipesController.js # Validation recettes (admin)
│   ├── adminUsersController.js   # Gestion utilisateurs (admin)
│   ├── adminIngredientsController.js
│   ├── adminCategoriesController.js
│   ├── mediaController.js        # Films et séries
│   └── tmdbController.js         # Proxy TMDB
├── routes/                       # Définition des routes Express
│   ├── ingredientsRoutes.js      # GET /search (public) + POST / (JWT requis)
│   └── ...
├── middlewares/                  # Auth, admin, validation, upload, erreurs
├── lib/                          # Services transverses
│   ├── prisma.js                 # Instance Prisma singleton
│   ├── mailer.js                 # Envoi d'emails
│   ├── posterService.js          # Téléchargement et cache des posters TMDB
│   └── tmdbCache.js              # Cache mémoire des requêtes TMDB
├── validators/                   # Schémas Zod
├── mappers/                      # Transformation des données API
└── jobs/                         # Cron RGPD (vérification inactivité comptes)
```

---

## Images uploadées

Les images de recettes sont stockées dans `public/uploads/recipes/` et servies avec :
- `Cross-Origin-Resource-Policy: cross-origin` (accès cross-origin autorisé)
- `Cache-Control: public, max-age=604800` (cache 7 jours navigateur)

---

## Tests

Deux suites de tests dans `api/tests/` :

| Fichier                  | Type         | Couvre                                           |
|--------------------------|--------------|--------------------------------------------------|
| `test-api.js`            | Intégration  | Admin users, catégories, contact, notifications  |
| `test-api-security.js`   | Intégration  | Sécurité HTTP, injections, CORS, JWT, RGPD, ingrédients, recettes |

Les comptes de test sont recréés automatiquement si supprimés lors d'un run précédent.

```bash
npm run test:all
```

---

## Dépannage

**Erreur de connexion PostgreSQL**
Vérifier `DATABASE_URL` dans `api/.env`.

**Erreur Prisma P2021 (table manquante)**
```bash
pnpm run db:push
```

**Token JWT expiré en dev**
Augmenter `JWT_EXPIRES_IN` dans `.env` (ex: `30d`).

**Images uploadées non visibles**
Les chemins d'images sont stockés en relatif (`/uploads/...`) et préfixés côté client via `buildApiAssetUrl()`. Vérifier que `VITE_API_URL` est défini côté front et pointe vers la bonne origine API.

**Tests : Login failed**
Les comptes de test ont peut-être été supprimés. `ensureTestUsers()` les recrée automatiquement au prochain `pnpm run test:all`.
