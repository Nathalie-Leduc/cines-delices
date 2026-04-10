# Ciné Délices

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
