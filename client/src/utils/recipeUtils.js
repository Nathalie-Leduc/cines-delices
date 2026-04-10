// recipeUtils.js
// Fonctions utilitaires partagées pour la manipulation des données recettes.
// Importées par RecipeCard, RecipeDetail, Home, MemberRecipes, etc.
// Évite la duplication de ces helpers dans chaque composant/page.

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
