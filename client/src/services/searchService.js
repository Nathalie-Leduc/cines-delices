import { getMoviesCatalog, getSeriesCatalog } from "./mediaService";
import { getRecipesCatalog } from "./recipesService";

const RECIPE_SEARCH_LIMIT = 4;
const MEDIA_SEARCH_LIMIT = 3;
const TOTAL_RESULTS_LIMIT = 8;

const TYPE_PRIORITY = {
  recipe: 1,
  movie: 2,
  series: 3,
};

function normalizeSearchValue(value) {
  return String(value || "").trim().toLowerCase();
}

function computeFieldMatchScore(field, query) {
  const normalizedField = normalizeSearchValue(field);

  if (!normalizedField || !query) {
    return 0;
  }

  if (normalizedField === query) {
    return 120;
  }

  if (normalizedField.startsWith(query)) {
    return 95;
  }

  if (normalizedField.split(/\s+/).some((token) => token.startsWith(query))) {
    return 80;
  }

  if (normalizedField.includes(query)) {
    return 60;
  }

  return 0;
}

function computeSearchScore(item, normalizedQuery) {
  const primaryScore = computeFieldMatchScore(item.title, normalizedQuery);
  const secondaryScore = Math.max(computeFieldMatchScore(item.mediaTitle, normalizedQuery) - 20, 0);
  const typeBonus = item.type === "recipe" ? 0 : 5;

  return Math.max(primaryScore, secondaryScore) + typeBonus;
}

function sortSearchResults(items, normalizedQuery) {
  return [...items]
    .map((item) => ({
      ...item,
      score: computeSearchScore(item, normalizedQuery),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (TYPE_PRIORITY[right.type] !== TYPE_PRIORITY[left.type]) {
        return TYPE_PRIORITY[right.type] - TYPE_PRIORITY[left.type];
      }

      return left.title.localeCompare(right.title, "fr", { sensitivity: "base" });
    })
    .slice(0, TOTAL_RESULTS_LIMIT)
    .map(({ score: _score, ...item }) => item);
}

function mapRecipeSearchResult(recipe) {
  const slugOrId = recipe?.slug || recipe?.id;

  if (!slugOrId) {
    return null;
  }

  const mediaTitle = recipe?.media?.titre || "";

  return {
    key: `recipe:${slugOrId}`,
    type: "recipe",
    badgeLabel: "Recette",
    title: recipe?.titre || "Recette sans titre",
    mediaTitle,
    meta: mediaTitle ? `Inspirée par ${mediaTitle}` : "Accéder au détail de la recette",
    image: recipe?.imageURL || recipe?.imageUrl || recipe?.media?.posterUrl || "/img/hero-home.png",
    to: `/recipes/${slugOrId}`,
  };
}

function mapMovieSearchResult(movie) {
  if (!movie?.slug) {
    return null;
  }

  return {
    key: `movie:${movie.slug}`,
    type: "movie",
    badgeLabel: "Film",
    title: movie?.title || "Film sans titre",
    mediaTitle: "",
    meta: "Voir les recettes liées à ce film",
    image: movie?.poster || "/img/parrain-poster.png",
    to: `/films/${movie.slug}`,
  };
}

function mapSeriesSearchResult(series) {
  if (!series?.slug) {
    return null;
  }

  return {
    key: `series:${series.slug}`,
    type: "series",
    badgeLabel: "Série",
    title: series?.title || "Série sans titre",
    mediaTitle: "",
    meta: "Voir les recettes liées à cette série",
    image: series?.poster || "/img/stranger-thing-poster.png",
    to: `/series/${series.slug}`,
  };
}

export async function searchHeaderContent(searchTerm) {
  const normalizedQuery = String(searchTerm || "").trim();

  if (normalizedQuery.length < 2) {
    return [];
  }

  const [recipesResult, moviesResult, seriesResult] = await Promise.allSettled([
    getRecipesCatalog({
      q: normalizedQuery,
      limit: RECIPE_SEARCH_LIMIT,
      page: 1,
    }),
    getMoviesCatalog({
      q: normalizedQuery,
      limit: MEDIA_SEARCH_LIMIT,
      page: 1,
    }),
    getSeriesCatalog({
      q: normalizedQuery,
      limit: MEDIA_SEARCH_LIMIT,
      page: 1,
    }),
  ]);

  const recipeItems = recipesResult.status === "fulfilled"
    ? (Array.isArray(recipesResult.value?.recipes) ? recipesResult.value.recipes : [])
        .map(mapRecipeSearchResult)
        .filter(Boolean)
    : [];

  const movieItems = moviesResult.status === "fulfilled"
    ? (Array.isArray(moviesResult.value?.movies) ? moviesResult.value.movies : [])
        .map(mapMovieSearchResult)
        .filter(Boolean)
    : [];

  const seriesItems = seriesResult.status === "fulfilled"
    ? (Array.isArray(seriesResult.value?.series) ? seriesResult.value.series : [])
        .map(mapSeriesSearchResult)
        .filter(Boolean)
    : [];

  return sortSearchResults(
    [...recipeItems, ...movieItems, ...seriesItems],
    normalizeSearchValue(normalizedQuery),
  );
}
