# Ciné Délices — API

API REST Node.js/Express pour l'application Ciné Délices.

## Stack

- Node.js >= 24 (ESM)
- Express 5
- Prisma 7 + PostgreSQL
- JWT + Argon2
- Zod
- Swagger UI (documentation interactive)
- Nodemailer (emails)
- Sharp (images WebP)

## Prérequis

- Node.js >= 24
- PostgreSQL (ou Docker)
- Clé API TMDB : https://www.themoviedb.org/settings/api

## Installation

```bash
cd api
cp .env.example .env
# Remplir les variables dans .env
npm install
```

## Variables d'environnement

| Variable | Description | Exemple |
|---|---|---|
| `PORT` | Port du serveur | `3000` |
| `DATABASE_URL` | URL PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Clé secrète JWT | chaîne aléatoire 64 hex |
| `JWT_EXPIRES_IN` | Durée du token | `7h` |
| `TMDB_API_KEY` | Clé API TMDB | — |
| `TMDB_BASE_URL` | URL base TMDB | `https://api.themoviedb.org/3` |
| `CLIENT_URL` | URL du front (CORS) | `http://localhost:5173` |
| `API_BASE_URL` | URL publique du back | `http://localhost:3000` |
| `SMTP_HOST` | Hôte SMTP | `sandbox.smtp.mailtrap.io` |
| `SMTP_PORT` | Port SMTP | `587` |
| `SMTP_USER` | Utilisateur SMTP | — |
| `SMTP_PASS` | Mot de passe SMTP | — |
| `SMTP_FROM` | Expéditeur email | `Ciné Délices <noreply@...>` |

Générer un JWT_SECRET solide :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Scripts

| Commande | Action |
|---|---|
| `npm run dev` | Serveur en développement (nodemon) |
| `npm run start` | Serveur en production |
| `npm run lint` | Lint ESLint |
| `npm run db:generate` | Génère le Prisma Client |
| `npm run db:migrate` | Crée et applique une migration |
| `npm run db:push` | Synchronise le schéma (sans migration) |
| `npm run db:seed` | Injecte les données de seed |
| `npm run db:reset` | Reset complet + seed |
| `npm run db:studio` | Ouvre Prisma Studio |
| `npm run test` | Lance les tests d'intégration |
| `npm run convert:images` | Convertit les images uploadées en WebP |
| `npm run convert:posters` | Convertit les posters TMDB en WebP |
| `npm run fix:media` | Corrige les métadonnées médias manquantes |

## Documentation interactive

**Swagger UI** disponible sur : http://localhost:3000/api-docs

Tu peux tester toutes les routes directement depuis l'interface.
Pour les routes protégées, clique sur **Authorize** et colle ton JWT.

## Routes principales

Base URL : `http://localhost:3000/api`

### Auth (public)

| Méthode | Route | Description |
|---|---|---|
| POST | `/auth/register` | Inscription |
| POST | `/auth/login` | Connexion → retourne un JWT |
| GET | `/auth/logout` | Déconnexion |
| GET | `/auth/me` | Profil connecté 🔒 |
| PUT | `/auth/me` | Modifier profil 🔒 |
| PUT | `/auth/me/password` | Modifier mot de passe 🔒 |
| DELETE | `/auth/me` | Supprimer son compte 🔒 |

### Recettes (public + membre)

| Méthode | Route | Description |
|---|---|---|
| GET | `/recipes` | Catalogue recettes publiées |
| GET | `/recipes/:id` | Détail d'une recette |
| POST | `/recipes` | Créer une recette 🔒 |
| PATCH | `/recipes/:id` | Modifier une recette 🔒 |
| DELETE | `/recipes/:id` | Supprimer une recette 🔒 |
| PATCH | `/recipes/:id/submit` | Soumettre en validation 🔒 |

### Utilisateurs (membre)

| Méthode | Route | Description |
|---|---|---|
| GET | `/users/me` | Profil du membre 🔒 |
| GET | `/users/me/recipes` | Recettes du membre 🔒 |
| GET | `/users/me/notifications` | Notifications 🔒 |
| DELETE | `/users/me/notifications/:id` | Supprimer une notification 🔒 |

### Catégories

| Méthode | Route | Description |
|---|---|---|
| GET | `/categories` | Liste des catégories |
| POST | `/categories` | Créer une catégorie 🔒 Admin |
| PATCH | `/categories/:id` | Modifier une catégorie 🔒 Admin |
| DELETE | `/categories/:id` | Supprimer une catégorie 🔒 Admin |

### Ingrédients

| Méthode | Route | Description |
|---|---|---|
| GET | `/ingredients/search` | Rechercher un ingrédient |
| POST | `/ingredients` | Soumettre un ingrédient 🔒 |

### Médias (films & séries)

| Méthode | Route | Description |
|---|---|---|
| GET | `/media/movies` | Catalogue des films |
| GET | `/media/movies/:slug` | Détail d'un film |
| GET | `/media/series` | Catalogue des séries |
| GET | `/media/series/:slug` | Détail d'une série |

### TMDB

| Méthode | Route | Description |
|---|---|---|
| GET | `/tmdb/medias/search` | Rechercher film/série sur TMDB |
| GET | `/tmdb/medias/:type` | Catalogue par type (movie/tv) |
| GET | `/tmdb/medias/:type/:id` | Détail d'un média TMDB |

### Contact

| Méthode | Route | Description |
|---|---|---|
| POST | `/contact` | Envoyer un message de contact |

### Admin 🔒

| Méthode | Route | Description |
|---|---|---|
| GET | `/admin/recipes` | Toutes les recettes publiées |
| GET | `/admin/recipes/pending` | Recettes en attente |
| PATCH | `/admin/recipes/:id` | Modifier une recette |
| PATCH | `/admin/recipes/:id/publish` | Valider une recette |
| PATCH | `/admin/recipes/:id/reject` | Refuser une recette |
| DELETE | `/admin/recipes/:id` | Supprimer + notifier le membre |
| GET | `/admin/users` | Liste des utilisateurs |
| GET | `/admin/users/:id/recipes` | Recettes d'un membre |
| PATCH | `/admin/users/:id/role` | Modifier le rôle |
| DELETE | `/admin/users/:id` | Supprimer un utilisateur |
| GET | `/admin/notifications` | Notifications admin |
| DELETE | `/admin/notifications/:id` | Supprimer une notification |
| GET | `/admin/categories` | Catégories (admin) |
| POST | `/admin/categories` | Créer une catégorie |
| PATCH | `/admin/categories/:id` | Modifier une catégorie |
| DELETE | `/admin/categories/:id` | Supprimer une catégorie |
| GET | `/admin/categories/:id/recipes` | Recettes d'une catégorie |
| GET | `/admin/ingredients` | Ingrédients en attente |
| GET | `/admin/ingredients/validated` | Ingrédients validés |
| POST | `/admin/ingredients` | Créer un ingrédient validé |
| POST | `/admin/ingredients/merge` | Fusionner deux ingrédients |
| PATCH | `/admin/ingredients/:id` | Modifier un ingrédient |
| PATCH | `/admin/ingredients/:id/approve` | Approuver un ingrédient |
| DELETE | `/admin/ingredients/:id` | Refuser + supprimer |
| GET | `/admin/ingredients/:id/recipes` | Recettes utilisant un ingrédient |

## Base de données

### Lancement avec Docker (recommandé)

```bash
# Depuis la racine du projet
docker compose up db
```

### Premier lancement

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### Prisma Studio

```bash
npm run db:studio
# Ouvre http://localhost:5555
```

## Scripts utilitaires

| Fichier | Description |
|---|---|
| `scripts/convert-images-to-webp.mjs` | Convertit les images uploadées en WebP |
| `scripts/convert-static-images.mjs` | Convertit les images statiques en WebP |
| `scripts/migrate-posters-to-webp.mjs` | Migre les posters TMDB en WebP |
| `scripts/fix-media-details.mjs` | Corrige les métadonnées médias manquantes |
| `prisma/debug-seed.js` | Diagnostic de la connexion BDD |
| `prisma/fix-db.js` | Patch ponctuel de schéma |
| `tests/test-api.js` | Tests d'intégration API |

## Dépannage

**Erreur de connexion PostgreSQL**
```bash
docker compose ps
# Vérifier DATABASE_URL dans api/.env
```

**Erreur Prisma P2021 (table manquante)**
```bash
npm run db:push
```

**Token JWT expiré en dev**
Augmenter `JWT_EXPIRES_IN` dans `.env` (ex: `30d`).