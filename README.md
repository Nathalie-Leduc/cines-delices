# Cine Delices

Application web de recettes inspirees du cinema et des series, composee d'un front React/Vite et d'une API Node.js/Express avec PostgreSQL (Prisma).

## Sommaire

- [Cine Delices](#cine-delices)
  - [Sommaire](#sommaire)
  - [Presentation](#presentation)
  - [Stack technique](#stack-technique)
    - [Front](#front)
    - [Back](#back)
    - [Infra](#infra)
  - [Arborescence](#arborescence)
  - [Pre-requis](#pre-requis)
  - [Configuration](#configuration)
    - [1) API](#1-api)
    - [2) Client](#2-client)
  - [Lancement avec Docker (recommande)](#lancement-avec-docker-recommande)
  - [Lancement en local (sans Docker)](#lancement-en-local-sans-docker)
    - [1) Base de donnees](#1-base-de-donnees)
    - [2) API](#2-api)
    - [3) Client](#3-client)
  - [Scripts utiles](#scripts-utiles)
    - [API (dossier api)](#api-dossier-api)
    - [Client (dossier client)](#client-dossier-client)
  - [API - routes principales](#api---routes-principales)
    - [Health](#health)
    - [TMDB](#tmdb)
    - [Auth](#auth)
    - [Users](#users)
  - [Tests](#tests)
    - [API](#api)
    - [Client](#client)
  - [Depannage](#depannage)
    - [Le front affiche "Failed to fetch"](#le-front-affiche-failed-to-fetch)
    - [Erreurs Prisma](#erreurs-prisma)
  - [Contribuer](#contribuer)
  - [Documentation](#documentation)

## Presentation

Le projet permet de:

- consulter des medias (films/series) via TMDB
- associer des recettes a des medias
- gerer un espace utilisateur (profil, recettes personnelles)
- authentifier les utilisateurs (inscription/connexion)

## Stack technique

### Front

- React 19
- React Router
- Vite
- Sass
- Vitest + Testing Library

### Back

- Node.js (ESM)
- Express
- Prisma
- PostgreSQL
- JWT + Argon2
- Zod

### Infra

- Docker Compose

## Arborescence

```text
.
├── api/        # API Express + Prisma
├── client/     # Front React/Vite
├── docs/       # Documentation projet
└── docker-compose.yml
```

## Pre-requis

- Node.js >= 24
- npm >= 10
- Docker + Docker Compose (recommande)
- Une cle API TMDB

## Configuration

### 1) API

Dans le dossier api, creer le fichier d'environnement a partir de l'exemple:

```bash
cd api
cp .env.example .env
```

Variables importantes a renseigner dans api/.env:

- TMDB_API_KEY
- JWT_SECRET
- DATABASE_URL

### 2) Client

Dans le dossier client, creer le fichier d'environnement:

```bash
cd client
cp .env.example .env
```

Variables utiles dans client/.env:

- VITE_API_URL (par defaut: http://localhost:3000)
- VITE_INGREDIENT_SEARCH_API_URL
- VITE_RECIPE_API_URL
- VITE_USER_API_URL

## Lancement avec Docker (recommande)

Depuis la racine du projet:

```bash
docker compose up --build
```

Services disponibles:

- Front: http://localhost:5173
- API: http://localhost:3000
- Healthcheck API: http://localhost:3000/api/health
- PostgreSQL: localhost:5432

Arret:

```bash
docker compose down
```

## Lancement en local (sans Docker)

### 1) Base de donnees

Demarrer PostgreSQL localement, puis verifier la valeur de DATABASE_URL dans api/.env.

### 2) API

```bash
cd api
npm install
npm run db:generate
npm run db:push
npm run dev
```

### 3) Client

```bash
cd client
npm install
npm run dev
```

## Scripts utiles

### API (dossier api)

- npm run dev: lance le serveur en mode developpement (nodemon)
- npm run start: lance le serveur en mode production
- npm run lint: lint du code
- npm run test: script de test API
- npm run test:run: execute les tests vitest
- npm run db:generate: genere Prisma Client
- npm run db:push: synchronise le schema sur la base
- npm run db:migrate: cree/applique une migration en dev
- npm run db:seed: injecte les donnees de seed
- npm run db:reset: reset + seed
- npm run db:studio: ouvre Prisma Studio

### Client (dossier client)

- npm run dev: lance Vite en developpement
- npm run build: build de production
- npm run preview: previsualise le build
- npm run lint: lint du code
- npm run test: lance Vitest en watch
- npm run test:run: execute les tests une fois

## API - routes principales

Base URL: http://localhost:3000/api

### Health

- GET /health

### TMDB

- GET /tmdb/medias
- GET /tmdb/medias/:type
- GET /tmdb/medias/:type/:id
- GET /tmdb/medias/search?searchTerm=...

### Auth

- POST /auth/register
- POST /auth/login
- GET /auth/logout
- GET /auth/me
- PATCH /auth/me
- DELETE /auth/me

### Users

- GET /users/me
- GET /users/me/recipes

## Tests

### API

```bash
cd api
npm run test:run
```

### Client

```bash
cd client
npm run test:run
```

## Depannage

### Le front affiche "Failed to fetch"

Verifier dans cet ordre:

1. que l'API tourne sur le port 3000
2. que client/.env pointe vers la bonne URL (VITE_API_URL)
3. que la route /api/health repond
4. que la cle TMDB est bien definie dans api/.env

Commandes utiles:

```bash
docker compose ps
docker compose logs -f api
curl http://localhost:3000/api/health
```

### Erreurs Prisma

Relancer les etapes Prisma cote API:

```bash
cd api
npm run db:generate
npm run db:push
```

## Contribuer

1. Creer une branche de travail
2. Faire des commits atomiques et explicites
3. Lancer lint et tests avant push
4. Ouvrir une Pull Request avec description claire

---

## Documentation

Documentation

API Swagger : http://localhost:3000/api-docs
Prisma Studio : npx prisma studio
Cahier des charges : docs/cahier-des-charges.pdf


Projet realise dans le cadre de la formation O'clock.