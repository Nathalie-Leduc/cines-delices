# 🎬 Ciné Délices

> *"La cuisine, c'est l'art. Le cinéma aussi. Ici, les deux se rencontrent dans l'assiette."*

Application web communautaire où chaque recette est inspirée d'un film ou d'une série culte.
Cuisinez comme vos personnages préférés, explorez le catalogue et partagez vos créations.

---

## Structure du projet

```
.
├── api/        # API REST — la cuisine se prépare ici (Node.js/Express/Prisma)
└── client/     # Front React — la salle de cinéma (React/Vite)
```

→ [Documentation API](./api/README.md)
→ [Documentation Client](./client/README.md)

---

## Démarrage rapide

### Avec Docker (recommandé pour le dev)

```bash
# Copier les variables d'environnement
cp api/.env.example api/.env
# Remplir api/.env (TMDB_API_KEY obligatoire)

# Lancer tous les services
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

---

## Prérequis

- Node.js >= 24
- PostgreSQL (local ou hébergé)
- Clé API TMDB — https://www.themoviedb.org/settings/api

---

## Stack technique

| Couche          | Technologie                          |
|-----------------|--------------------------------------|
| Front           | React 19, React Router 7, Vite 6, Sass |
| Back            | Node.js 24, Express 5, Prisma 7      |
| Base de données | PostgreSQL                           |
| Auth            | JWT + Argon2                         |
| Images          | Sharp (WebP, compression automatique)|
| Emails          | Nodemailer                           |
| Tests           | Vitest, Testing Library              |
| Déploiement     | Railway                              |

---

## Tests

```bash
# API
cd api && npm run test

# Client
cd client && npm run test:run
```

---

## Contribuer

Le projet suit un workflow Git par branches thématiques :

1. Créer une branche depuis `develop` : `git checkout -b fix/ma-correction`
2. Commits atomiques en anglais : `fix: short description`
3. Lancer lint et tests avant push
4. Ouvrir une Pull Request vers `develop`

---

## Déploiement

L'application est déployée sur Railway :

| Service | URL |
|---------|-----|
| Front   | https://graceful-quietude-production.up.railway.app |
| API     | https://cines-delices-production.up.railway.app     |

---

*Projet réalisé dans le cadre de la formation CDA — O'clock.*
