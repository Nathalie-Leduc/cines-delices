# Ciné Délices — Client

Interface utilisateur React/Vite pour l'application Ciné Délices.

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
