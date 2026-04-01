export const FILTERS = [
  { label: "Tous", value: "Tous", key: "tous" },
  { label: "Entrée", value: "Entrée", key: "entree" },
  { label: "Plat", value: "Plat", key: "plat" },
  { label: "Dessert", value: "Dessert", key: "dessert" },
  { label: "Boisson", value: "Boisson", key: "boisson" },
];

export const LIMIT_OPTIONS = [6, 9, 12, 15];

export const CATEGORY_PARAM_TO_FILTER = {
  entree: "Entrée",
  entrees: "Entrée",
  plat: "Plat",
  plats: "Plat",
  dessert: "Dessert",
  desserts: "Dessert",
  boisson: "Boisson",
  boissons: "Boisson",
};

export function normalizeCategoryLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "entree" || normalized === "entrée") return "Entrée";
  if (normalized === "plat") return "Plat";
  if (normalized === "dessert") return "Dessert";
  if (normalized === "boisson") return "Boisson";
  if (!normalized) return "Autre";

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function toCategoryFilterKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildCategoryFilters(categories = []) {
  const labels = categories
    .map((category) => normalizeCategoryLabel(String(category?.name || category?.nom || category || '').trim()))
    .filter(Boolean);

  const uniqueLabels = Array.from(new Set(labels));
  const preferredOrder = ['Entrée', 'Plat', 'Dessert', 'Boisson'];
  const orderedLabels = [
    ...preferredOrder.filter((label) => uniqueLabels.includes(label)),
    ...uniqueLabels.filter((label) => !preferredOrder.includes(label)),
  ];

  return [
    { label: 'Tous', value: 'Tous', key: 'tous' },
    ...orderedLabels.map((label) => ({
      label,
      value: label,
      key: toCategoryFilterKey(label),
    })),
  ];
}

export function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function mapApiRecipeToCard(recipe) {
  const prep = Number(recipe?.tempsPreparation);
  const cook = Number(recipe?.tempsCuisson);
  const duration = [prep, cook].filter(Number.isFinite).reduce((sum, value) => sum + value, 0);

  return {
    id: recipe?.id,
    slug: recipe?.slug,
    title: recipe?.titre || "Recette sans titre",
    category: normalizeCategoryLabel(recipe?.category?.nom),
    mediaTitle: recipe?.media?.titre || "Sans média",
    mediaType: recipe?.media?.type === "SERIES" ? "série" : "film",
    duration: duration > 0 ? duration : 0,
    image: recipe?.imageURL || recipe?.imageUrl || "/img/hero-home.png",
    fallbackImage: recipe?.media?.posterUrl || "/img/hero-home.png",
  };
}

export function mixRecipesByCategory(recipes) {
  const categoryOrder = ["Entrée", "Plat", "Dessert", "Boisson"];
  const buckets = new Map(categoryOrder.map((category) => [category, []]));

  recipes.forEach((recipe) => {
    const category = recipe.category || "Autre";
    if (!buckets.has(category)) {
      buckets.set(category, []);
    }
    buckets.get(category).push(recipe);
  });

  const mixed = [];
  let hasRemaining = true;

  while (hasRemaining) {
    hasRemaining = false;

    for (const category of buckets.keys()) {
      const bucket = buckets.get(category);
      if (bucket?.length) {
        mixed.push(bucket.shift());
        hasRemaining = true;
      }
    }
  }

  return mixed;
}

export function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
