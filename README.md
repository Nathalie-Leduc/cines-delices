# 🎬 Cinés Délices

> *"La cuisine, c'est l'art. Le cinéma aussi. Ici, les deux se rencontrent dans l'assiette."*

Application web communautaire où chaque recette est inspirée d'un film ou d'une série culte.
Cuisinez comme vos personnages préférés, explorez le catalogue et partagez vos créations.

---

## Structure du projet

```
.
├── api/              # API REST — la cuisine se prépare ici (Node.js/Express/Prisma)
├── client/           # Front React — la salle de cinéma (React/Vite)
└── docker-compose.yml
```

→ [Documentation API](./api/README.md)
→ [Documentation Client](./client/README.md)

---

## Démarrage rapide

### Avec Docker (recommandé pour le dev)

```bash
cp api/.env.example api/.env
# Remplir api/.env (TMDB_API_KEY obligatoire)

docker compose up --build
```

| Service    | URL                              |
|------------|----------------------------------|
| Front      | http://localhost:5173            |
| API        | http://localhost:3000            |
| Health     | http://localhost:3000/api/health |
| Swagger    | http://localhost:3000/api-docs   |
| PostgreSQL | localhost:5432                   |

Arrêt :
```bash
docker compose down
```

### En local (sans Docker)

**1. Base de données** — démarrer PostgreSQL localement et renseigner `DATABASE_URL` dans `api/.env`.

**2. API**
```bash
cd api
cp .env.example .env   # remplir les variables (TMDB_API_KEY obligatoire)
pnpm install
pnpm run db:generate
pnpm run db:push
pnpm run db:seed
pnpm run dev
```

**3. Client**
```bash
cd client
cp .env.example .env
pnpm install
pnpm run dev
```

---

## Prérequis

- Node.js >= 24
- Docker + Docker Compose (pour le lancement Docker)
- Clé API TMDB — https://www.themoviedb.org/settings/api

---

## Tests

```bash
# API — tests d'intégration (nécessite l'API Railway déployée)
cd api && pnpm run test          # test-api.js
cd api && pnpm run test:security # test-api-security.js (sécurité, JWT, RGPD, ingrédients)
cd api && pnpm run test:all      # les deux à la suite

# Client — tests unitaires (sans serveur)
cd client && pnpm run test:run
```

---

## Stack technique

| Couche          | Technologie                           |
|-----------------|---------------------------------------|
| Front           | React 19, React Router 7, Vite 6, Sass |
| Back            | Node.js 24, Express 5, Prisma 7       |
| Base de données | PostgreSQL                            |
| Auth            | JWT + Argon2                          |
| Images          | Sharp (WebP, compression automatique) |
| Emails          | Nodemailer                            |
| Tests           | Vitest + Testing Library (client), Node assert (API) |
| Déploiement     | Railway                               |

---

## Déploiement

| Service     | URL                                                          |
|-------------|--------------------------------------------------------------|
| Front       | https://graceful-quietude-production.up.railway.app          |
| API         | https://cines-delicesapi-production.up.railway.app           |
| Swagger     | https://cines-delicesapi-production.up.railway.app/api/docs  |

### Comptes de test (seed v-4)

| Rôle    | Email                              | Mot de passe   |
|---------|------------------------------------|----------------|
| Admin   | `admin@cinesdelices.fr`            | `Admin1234!`   |
| Membre  | `marie@cinesdelices.fr`            | `Member1234!`  |
| Membre  | `remy@cinesdelices.fr`             | `Member1234!`  |

Pour tester l'API via Swagger : `POST /api/auth/login` avec ces identifiants → copier le `token` de la réponse → cliquer sur **Authorize** (cadenas en haut à droite) → coller le token dans `bearerAuth` → tester les routes protégées.

### Prérequis Node

- Node.js >= 24 (utilisé en local et sur Railway)
- pnpm >= 10 (`npm install -g pnpm`)

---

## Contribuer

1. Créer une branche depuis `develop` : `git checkout -b fix/mon-correctif`
2. Commits atomiques en anglais : `fix: description courte`
3. Lancer lint et tests avant push
4. Ouvrir une Pull Request vers `develop`

---

*Projet réalisé dans le cadre de la formation CDA — O'clock.*
