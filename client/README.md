# 🎬 Cinés Délices — Client

Interface utilisateur de Cinés Délices : le catalogue de recettes inspirées du cinéma et des séries.

---

## Stack

- React 19
- React Router 7
- Vite 6 (avec code splitting par chunk thématique)
- Sass (CSS Modules)
- Vitest + Testing Library

---

## Prérequis

- Node.js >= 24
- L'API doit tourner sur `http://localhost:3000` (voir `api/README.md`)

---

## Installation

```bash
cd client
cp .env.example .env
npm install
```

---

## Variables d'environnement

| Variable                         | Description                      | Défaut                                         |
|----------------------------------|----------------------------------|------------------------------------------------|
| `VITE_API_URL`                   | URL de base de l'API             | `http://localhost:3000`                        |
| `VITE_INGREDIENT_SEARCH_API_URL` | Route recherche ingrédients      | `http://localhost:3000/api/ingredients/search` |
| `VITE_RECIPE_API_URL`            | Route recettes                   | `http://localhost:3000/api/recipes`            |
| `VITE_USER_API_URL`              | Route utilisateurs               | `http://localhost:3000/api/users`              |

---

## Scripts

| Commande            | Action                               |
|---------------------|--------------------------------------|
| `npm run dev`       | Lance Vite en développement          |
| `npm run build`     | Build de production (chunks séparés) |
| `npm run preview`   | Prévisualise le build                |
| `npm run lint`      | Lint ESLint                          |
| `npm run test`      | Lance Vitest en watch                |
| `npm run test:run`  | Exécute les tests une fois           |

---

## Structure

```
client/src/
├── components/       # Composants réutilisables
│   ├── Navbar/       # Navigation principale (desktop + mobile)
│   ├── RecipeCard/   # Carte recette du catalogue
│   ├── FilmCard/     # Carte film/série
│   ├── Footer/       # Pied de page
│   └── ...
├── pages/            # Pages de l'application
│   ├── Home/         # Page d'accueil avec hero et carousel
│   ├── RecipesPage/  # Catalogue recettes avec filtres
│   ├── RecipeDetail/ # Détail d'une recette
│   ├── Movies/       # Catalogue films
│   ├── Series/       # Catalogue séries
│   ├── Admin/        # Dashboard admin (validation, gestion)
│   ├── MemberRecipes/    # Espace membre — mes recettes
│   ├── MemberProfile/    # Profil membre
│   ├── CreateRecipe/     # Formulaire de création de recette
│   ├── Login/            # Connexion
│   ├── Signup/           # Inscription
│   └── ResetPassword/    # Réinitialisation mot de passe
├── layouts/          # Layouts partagés (Public, Member, Admin)
├── contexts/         # AuthContext (authentification globale)
├── services/         # Appels API
│   ├── api.js            # Client HTTP de base (request, buildApiUrl)
│   ├── authService.js    # Auth (login, register, profil, resetPassword)
│   ├── recipesService.js # Recettes publiques
│   ├── adminService.js   # Routes admin
│   └── mediaService.js   # Films et séries
├── router/           # Routes React Router (ProtectedRoute, AdminRoute)
├── styles/           # Tokens SCSS globaux (_tokens.scss)
├── utils/            # Fonctions utilitaires partagées
│   └── mediaSearch.js    # Helpers recherche TMDB
└── tests/            # Tests Vitest
    ├── recipeUtils.test.js     # formatMinutes, normalizeCategoryLabel, mapApiRecipeToCard
    ├── ResetPassword.test.jsx  # Page réinitialisation mot de passe
    ├── tmdb-recipes.test.js    # Services recettes et médias (mockés)
    ├── Navbar.test.jsx
    ├── ProtectedRoute.test.jsx
    ├── AdminRoute.test.jsx
    └── ...
```

---

## Rôles utilisateur

| Rôle     | Accès                                                           |
|----------|-----------------------------------------------------------------|
| Visiteur | Catalogue recettes, détail recette, films, séries               |
| Membre   | + Créer/modifier ses recettes, notifications, espace personnel  |
| Admin    | + Validation recettes/ingrédients, gestion complète            |

---

## Performances (Lighthouse mobile)

Les optimisations suivantes sont en place :

- **Code splitting** — 5 chunks distincts (vendor-react, chunk-admin, chunk-member, chunk-legal, index)
- **Lazy loading** — images de contenu chargées en différé
- **WebP compressé** — toutes les images statiques optimisées avec Sharp
- **Preconnect** — Google Fonts et API Railway préconnectés
- **Cache assets** — JS/CSS hashés mis en cache 1 an via `serve.json` (`immutable`)
- **Cache images** — `/img/**` et `/icon/**` mis en cache 30 jours
- **Meta description** — renseignée pour le SEO
- **Favicon SVG** — clap de cinéma + CD + toque, `client/public/favicon.svg`

| Métrique        | Score |
|-----------------|-------|
| Performances    | 86+   |
| Accessibilité   | 92    |
| Bonnes pratiques| 100   |
| SEO             | 100   |

---

## Dépannage

**"Failed to fetch" ou écran vide**
1. Vérifier que l'API tourne : `curl http://localhost:3000/api/health`
2. Vérifier `VITE_API_URL` dans `client/.env`
3. Redémarrer Vite après modification du `.env`

**Les images ne s'affichent pas**
Vérifier que `API_BASE_URL` est bien défini dans `api/.env`.

**Tests : stderr ECONNREFUSED**
Normal en environnement de test — le composant Home tente un fetch au montage.
Les tests passent quand même car l'erreur est gérée en interne.
