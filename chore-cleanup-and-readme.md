# Chore : nettoyage du projet + READMEs

## Contexte

Fin de sprint — on nettoie les fichiers inutiles, on déplace la doc,
et on crée des READMEs clairs pour la racine, l'API et le client.

## Branche de travail

```bash
git checkout develop
git pull
git checkout -b chore/cleanup-and-readme
```

---

## Étape 1 — Supprimer les fichiers inutiles

```bash
# Fichiers Claude Code — ne doivent pas être dans le repo
rm CLAUDE_CODE_INSTRUCTIONS.md
rm CLAUDE_CODE_BUGFIX2

# Dossier Codex — vide
rm -rf .codex

# VS Code — configs non pertinentes pour le projet
rm .vscode/launch.json
rm .vscode/settings.json
rmdir .vscode   # supprimer le dossier s'il est maintenant vide

# Docker API — doublon avec docker-compose.yml racine
rm api/docker-compose.yml

# Docker racine — .dockerignore inutile sans Dockerfile propre
rm .dockerignore

# Package racine — les dépendances sont dans api/ et client/
rm package.json
rm package-lock.json
rm pnpm-lock.yaml

# Dossier tests racine client — doublon avec client/src/tests/
rm -rf client/tests/
```

---

## Étape 2 — Déplacer le dossier docs/

Le dossier `docs/` ne doit pas vivre dans ce repo.
Il sera déplacé dans un repo séparé `cines-delices-docs`.

```bash
# Pour l'instant : supprimer du repo en conservant les fichiers localement
git rm -r --cached docs/
```

Ajouter `docs/` au `.gitignore` racine :

```bash
echo "" >> .gitignore
echo "# Documentation (repo séparé cines-delices-docs)" >> .gitignore
echo "docs/" >> .gitignore
```

> Les fichiers docs/ restent sur le disque local mais ne seront plus
> trackés par git. Tu pourras les déplacer dans le nouveau repo manuellement.

---

## Étape 3 — Créer `api/README.md`

Créer le fichier `api/README.md` avec ce contenu exact :

```markdown
# Cinés Délices — API

API REST Node.js/Express pour l'application Cinés Délices.

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
| `SMTP_FROM` | Expéditeur email | `Cinés Délices <noreply@...>` |

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
```

---

## Étape 4 — Créer `client/README.md`

Créer le fichier `client/README.md` avec ce contenu exact :

```markdown
# Cinés Délices — Client

Interface utilisateur React/Vite pour l'application Cinés Délices.

## Stack

- React 19
- React Router 7
- Vite 6
- Sass (CSS Modules)
- Vitest + Testing Library

## Prérequis

- Node.js >= 24
- L'API doit tourner sur `http://localhost:3000`
  (voir `api/README.md`)

## Installation

```bash
cd client
cp .env.example .env
npm install
```

## Variables d'environnement

| Variable | Description | Défaut |
|---|---|---|
| `VITE_API_URL` | URL de base de l'API | `http://localhost:3000` |
| `VITE_INGREDIENT_SEARCH_API_URL` | Route recherche ingrédients | `http://localhost:3000/api/ingredients/search` |
| `VITE_RECIPE_API_URL` | Route recettes | `http://localhost:3000/api/recipes` |
| `VITE_USER_API_URL` | Route utilisateurs | `http://localhost:3000/api/users` |

## Scripts

| Commande | Action |
|---|---|
| `npm run dev` | Lance Vite en développement |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualise le build |
| `npm run lint` | Lint ESLint |
| `npm run test` | Lance Vitest en watch |
| `npm run test:run` | Exécute les tests une fois |

## Structure

```
client/src/
├── components/       # Composants réutilisables
│   ├── AdminModal/   # Modale générique admin
│   ├── RecipeCard/   # Carte recette
│   ├── Navbar/       # Navigation principale
│   └── ...
├── pages/            # Pages de l'application
│   ├── Admin/        # Dashboard admin
│   ├── MemberRecipes/# Espace membre — recettes
│   ├── RecipeDetail/ # Détail d'une recette
│   └── ...
├── layouts/          # Layouts partagés (Public, Member, Admin)
├── contexts/         # Contextes React (AuthContext)
├── services/         # Appels API (adminService, recipesService…)
├── router/           # Configuration des routes React Router
├── styles/           # Tokens SCSS globaux
└── utils/            # Fonctions utilitaires
```

## Rôles utilisateur

| Rôle | Accès |
|---|---|
| Visiteur | Catalogue, détail recette, films/séries |
| Membre | + Créer/modifier ses recettes, notifications |
| Admin | + Validation recettes/ingrédients, gestion complète |

## Dépannage

**"Failed to fetch" ou écran vide**
1. Vérifier que l'API tourne : `curl http://localhost:3000/api/health`
2. Vérifier `VITE_API_URL` dans `client/.env`
3. Redémarrer Vite après modification du `.env`

**Les images ne s'affichent pas**
Vérifier que `API_BASE_URL` est bien défini dans `api/.env`.
```

---

## Étape 5 — Réécrire le `README.md` racine

Remplacer le contenu de `README.md` par :

```markdown
# Cinés Délices

Application web de recettes inspirées du cinéma et des séries.

Associez vos films et séries préférés à des recettes créées par la communauté.

## Structure du projet

```
.
├── api/              # API REST Node.js/Express + Prisma
├── client/           # Front React/Vite
└── docker-compose.yml
```

→ [Documentation API](./api/README.md)
→ [Documentation Client](./client/README.md)

## Démarrage rapide

### Avec Docker (recommandé)

```bash
# Copier les variables d'environnement
cp api/.env.example api/.env
# Remplir api/.env (TMDB_API_KEY obligatoire)

# Lancer tous les services
docker compose up --build
```

| Service | URL |
|---|---|
| Front | http://localhost:5173 |
| API | http://localhost:3000 |
| Health | http://localhost:3000/api/health |
| Swagger | http://localhost:3000/api-docs |
| PostgreSQL | localhost:5432 |

Arrêt :
```bash
docker compose down
```

### En local (sans Docker)

**1. Base de données** — démarrer PostgreSQL localement et renseigner `DATABASE_URL` dans `api/.env`.

**2. API**
```bash
cd api
cp .env.example .env   # puis remplir les variables
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

**3. Client**
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

## Prérequis

- Node.js >= 24
- Docker + Docker Compose (pour le lancement Docker)
- Clé API TMDB — https://www.themoviedb.org/settings/api

## Tests

```bash
# API
cd api && npm run test

# Client
cd client && npm run test:run
```

## Stack technique

| Couche | Technologie |
|---|---|
| Front | React 19, React Router 7, Vite, Sass |
| Back | Node.js, Express 5, Prisma 7 |
| Base de données | PostgreSQL 18 |
| Auth | JWT + Argon2 |
| Images | Sharp (WebP) |
| Emails | Nodemailer |
| Tests | Vitest, Testing Library |

## Contribuer

1. Créer une branche depuis `develop` : `git checkout -b fix/mon-correctif`
2. Commits atomiques en anglais : `fix: description courte`
3. Lancer lint et tests avant push
4. Ouvrir une Pull Request vers `develop`

---

Projet réalisé dans le cadre de la formation CDA — O'clock.
```

---

## Commit

```bash
git add -A
git commit -m "chore: remove unused files, move docs out of repo, add API and client READMEs"
```

## Push et PR

```bash
git push origin chore/cleanup-and-readme
```

Ouvre une Pull Request vers `develop` sur GitHub.

---

## Résumé des changements

### Fichiers supprimés
- `CLAUDE_CODE_INSTRUCTIONS.md`
- `CLAUDE_CODE_BUGFIX2`
- `.codex/`
- `.vscode/launch.json` + `.vscode/settings.json`
- `api/docker-compose.yml` (doublon avec racine)
- `.dockerignore`
- `package.json` + `package-lock.json` + `pnpm-lock.yaml` (racine)
- `client/tests/` (doublon avec `client/src/tests/`)

### Fichiers non-trackés (conservés sur disque)
- `docs/` → à déplacer dans le repo `cines-delices-docs`

### Fichiers créés
- `api/README.md`
- `client/README.md`

### Fichiers modifiés
- `README.md` (racine) — réécrit
- `.gitignore` — ajout de `docs/`