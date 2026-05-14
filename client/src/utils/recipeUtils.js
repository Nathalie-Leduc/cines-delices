// recipeUtils.js
// Fonctions utilitaires partagées pour la manipulation des données recettes.
// Importées par RecipeCard, RecipeDetail, Home, MemberRecipes, CreateRecipe,
// Admin/Dashboard, Admin/Recettes, etc.
// Évite la duplication de ces helpers dans chaque composant/page.

// ─────────────────────────────────────────────────────────────────────────────
// parseTimeToMinutes — convertit une saisie utilisateur en minutes entières
//
// Comprend trois formats, testés dans l'ordre après normalisation
// (lowercase, suppression des espaces, virgule → point) :
//   • Pattern 1 — "1h30", "1.5h", "2h"        → heures + minutes optionnelles
//   • Pattern 2 — "1:30", "01:30"             → format heure:minute
//   • Pattern 3 — "30min", "30mn", "30m", "30" → minutes seules
//
// Retourne :
//   • un entier positif si la saisie est valide
//   • undefined si la saisie est vide, invalide ou ≤ 0
//
// Cette fonction était dupliquée dans 4 fichiers (CreateRecipe, MemberRecipes,
// Admin/Dashboard, Admin/Recettes). Factorisée ici en avril 2026.
//
// Analogie 🍽️ : un assistant qui comprend toutes les façons de dire un temps
// et répond toujours en minutes pour la BDD.
//
// Exemples :
//   parseTimeToMinutes("1h30")  → 90
//   parseTimeToMinutes("90min") → 90
//   parseTimeToMinutes("1:30")  → 90
//   parseTimeToMinutes("1.5h")  → 90
//   parseTimeToMinutes("abc")   → undefined
//   parseTimeToMinutes("0")     → undefined
//   parseTimeToMinutes(null)    → undefined
// ─────────────────────────────────────────────────────────────────────────────
export function parseTimeToMinutes(value) {
  if (value === '' || value === null || value === undefined) return undefined;

  // Normalisation : lowercase, suppression des espaces, virgule → point
  const str = String(value).trim().toLowerCase()
    .replace(/\s+/g, '').replace(/,/g, '.');

  // Pattern 1 : "1h30", "1.5h", "2h" — heures et minutes optionnelles
  const hMatch = str.match(/^(\d+(?:\.\d+)?)h(?:(\d+)(?:min)?)?$/);
  if (hMatch) {
    const total = Math.round(parseFloat(hMatch[1]) * 60 + parseInt(hMatch[2] || '0', 10));
    return total > 0 ? total : undefined;
  }

  // Pattern 2 : "1:30", "01:30" — format heure:minute
  const colonMatch = str.match(/^(\d+):(\d+)(?::\d+)?$/);
  if (colonMatch) {
    const total = parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
    return total > 0 ? total : undefined;
  }

  // Pattern 3 : "30min", "30mn", "30m", "30" — minutes seules
  const minMatch = str.match(/^(\d+(?:\.\d+)?)(?:min|mn|m)?$/);
  if (minMatch) {
    const parsed = Math.round(parseFloat(minMatch[1]));
    return Number.isNaN(parsed) || parsed <= 0 ? undefined : parsed;
  }

  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// formatMinutes — affiche un temps en minutes de façon lisible
// < 60 min  → "30 min"
// >= 60 min → "1h20" ou "2h" (sans "0min" si pile)
// Analogie : comme une horloge de cuisine qui bascule en heures
// dès qu'on dépasse 59 minutes.
// ─────────────────────────────────────────────────────────────────────────────
export function formatMinutes(totalMinutes) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return null;
  const mins = Math.round(totalMinutes);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
}

// ─────────────────────────────────────────────────────────────────────────────
// toFiniteNumber — convertit une valeur en nombre fini positif
// Retourne undefined si la valeur est absente, nulle ou négative.
// Utilisé pour les temps de préparation/cuisson et le nombre de personnes.
// ─────────────────────────────────────────────────────────────────────────────
export function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// normalizeCategoryLabel — normalise un nom de catégorie en label d'affichage
// "entree" | "entrée" | "ENTREE" → "Entrée"
// Centralise la logique qui était dupliquée dans Home, RecipeDetail, MemberRecipes.
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeCategoryLabel(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'entree' || normalized === 'entrée') return 'Entrée';
  if (normalized === 'plat') return 'Plat';
  if (normalized === 'dessert') return 'Dessert';
  if (normalized === 'boisson') return 'Boisson';
  if (!normalized) return 'Autre';

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// mapApiRecipeToCard — transforme une recette brute de l'API
// en objet normalisé attendu par le composant RecipeCard.
// Gère les deux formats de réponse API (camelCase et snake_case).
// ─────────────────────────────────────────────────────────────────────────────
export function mapApiRecipeToCard(recipe) {
  const prep = Number(recipe?.tempsPreparation ?? recipe?.preparationTime);
  const cook = Number(recipe?.tempsCuisson ?? recipe?.cookingTime);
  const duration = [prep, cook].filter(Number.isFinite).reduce((sum, v) => sum + v, 0);

  return {
    id: recipe?.id,
    slug: recipe?.slug,
    title: recipe?.titre || recipe?.title || 'Recette sans titre',
    category: normalizeCategoryLabel(recipe?.category?.nom ?? recipe?.category),
    mediaTitle: recipe?.media?.titre ?? recipe?.movie ?? 'Sans média',
    mediaType: recipe?.media?.type === 'SERIES' ? 'série' : 'film',
    duration: duration > 0 ? duration : 0,
    image: recipe?.imageURL ?? recipe?.imageUrl ?? recipe?.image ?? null,
  };
}
