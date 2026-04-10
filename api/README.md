# Ciné Délices — API

API REST Node.js/Express pour l'application Ciné Délices.

## Stack

- Node.js >= 24 (ESM)
- Express 5
- Prisma 7 + PostgreSQL
- JWT + Argon2
- Zod
- Swagger (documentation auto)
- Nodemailer (emails)
- Sharp (images)

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
| `npm run convert:images` | Convertit les images en WebP |
| `npm run convert:posters` | Convertit les posters TMDB en WebP |
| `npm run fix:media` | Corrige les métadonnées médias manquantes |

## Routes principales

Base URL : `http://localhost:3000/api`

| Méthode | Route | Description | Auth |
|---|---|---|---|
| GET | `/health` | Vérification serveur | — |
| POST | `/auth/register` | Inscription | — |
| POST | `/auth/login` | Connexion | — |
| GET | `/auth/me` | Profil connecté | JWT |
| PATCH | `/auth/me` | Modifier profil | JWT |
| DELETE | `/auth/me` | Supprimer compte | JWT |
| GET | `/recipes` | Toutes les recettes publiées | — |
| POST | `/recipes` | Créer une recette | JWT |
| GET | `/recipes/:slug` | Détail d'une recette | — |
| PATCH | `/recipes/:id` | Modifier une recette | JWT |
| DELETE | `/recipes/:id` | Supprimer une recette | JWT |
| GET | `/users/me/recipes` | Recettes du membre connecté | JWT |
| GET | `/categories` | Liste des catégories | — |
| GET | `/ingredients/search` | Rechercher un ingrédient | — |
| GET | `/tmdb/medias/search` | Rechercher un film/série | — |
| GET | `/admin/recipes` | Toutes les recettes (admin) | JWT Admin |
| GET | `/admin/recipes/pending` | Recettes en attente | JWT Admin |
| PATCH | `/admin/recipes/:id/publish` | Valider une recette | JWT Admin |
| PATCH | `/admin/recipes/:id/reject` | Refuser une recette | JWT Admin |
| DELETE | `/admin/recipes/:id` | Supprimer une recette | JWT Admin |

Documentation complète : **http://localhost:3000/api-docs** (Swagger)

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

### Prisma Studio (interface visuelle)

```bash
npm run db:studio
# Ouvre http://localhost:5555
```

## Scripts utilitaires

Situés dans `api/scripts/` et `api/prisma/` :

- `scripts/convert-images-to-webp.mjs` — convertit les images uploadées en WebP
- `scripts/convert-static-images.mjs` — convertit les images statiques en WebP
- `scripts/migrate-posters-to-webp.mjs` — migre les posters TMDB en WebP
- `scripts/fix-media-details.mjs` — corrige les métadonnées médias manquantes
- `prisma/debug-seed.js` — diagnostic de la connexion BDD
- `prisma/fix-db.js` — patch ponctuel de schéma
- `tests/test-api.js` — tests d'intégration API

## Dépannage

**Erreur de connexion PostgreSQL**
```bash
# Vérifier que la DB tourne
docker compose ps
# Vérifier DATABASE_URL dans api/.env
```

**Erreur Prisma P2021 (table manquante)**
```bash
npm run db:push
```

**Token JWT expiré en dev**
Augmenter `JWT_EXPIRES_IN` dans `.env` (ex: `30d` pour le développement).
