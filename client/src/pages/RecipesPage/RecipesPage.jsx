import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import styles from "./RecipesPage.module.scss";
import RecipeCard from "../../components/RecipeCard";
import { getRecipesCatalog } from "../../services/recipesService";

const FILTERS = [
  { label: "Tous", value: "Tous", key: "tous" },
  { label: "Entrée", value: "Entrée", key: "entree" },
  { label: "Plat", value: "Plat", key: "plat" },
  { label: "Dessert", value: "Dessert", key: "dessert" },
  { label: "Boisson", value: "Boisson", key: "boisson" },
];

const LIMIT_OPTIONS = [6, 9, 12, 15];

const CATEGORY_PARAM_TO_FILTER = {
  entree: "Entrée",
  entrees: "Entrée",
  plat: "Plat",
  plats: "Plat",
  dessert: "Dessert",
  desserts: "Dessert",
  boisson: "Boisson",
  boissons: "Boisson",
};

function normalizeCategoryLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "entree" || normalized === "entrée") return "Entrée";
  if (normalized === "plat") return "Plat";
  if (normalized === "dessert") return "Dessert";
  if (normalized === "boisson") return "Boisson";

  return value || "Autre";
}

function mapApiRecipeToCard(recipe) {
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

function mixRecipesByCategory(recipes) {
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

export default function RecipesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [recipes, setRecipes] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.innerWidth <= 767);
  const [currentPage, setCurrentPage] = useState(Math.max(1, Number(searchParams.get("page") || 1)));
  const [currentLimit, setCurrentLimit] = useState(Math.max(1, Number(searchParams.get("limit") || 15)));
  const searchRef = useRef(null);

  const categoryParam = searchParams.get("category")?.toLowerCase() || "";
  const activeFilter = CATEGORY_PARAM_TO_FILTER[categoryParam] || "Tous";
  const currentQuery = searchParams.get("q")?.trim() || "";

  useEffect(() => {
    setSearchInput(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    const fetchRecipes = async () => {
      try {
        const payload = await getRecipesCatalog();
        const rawRecipes = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.recipes)              // ← ajouter ça
            ? payload.recipes
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

        if (!isMounted) return;

        const mappedRecipes = rawRecipes.map(mapApiRecipeToCard);
        setRecipes(activeFilter === "Tous" ? mixRecipesByCategory(mappedRecipes) : mappedRecipes);
        setPagination({
          page: Number(paginationPayload.page || currentPage),
          limit: Number(paginationPayload.limit || currentLimit),
          totalItems: Number(paginationPayload.totalItems || 0),
          totalPages: Number(paginationPayload.totalPages || 0),
          hasNextPage: Boolean(paginationPayload.hasNextPage),
          hasPreviousPage: Boolean(paginationPayload.hasPreviousPage),
        });
        setError("");
      } catch (fetchError) {
        if (!isMounted) return;
        setRecipes([]);
        setPagination({
          page: currentPage,
          limit: currentLimit,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        });
        setError(fetchError?.message || "Impossible de charger les recettes.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsPaginating(false);
        }
      }
    };

    fetchRecipes();

    return () => {
      isMounted = false;
    };
  }, [activeFilter, currentLimit, currentPage, currentQuery, recipes.length]);

  useEffect(() => {
    if (!searchInput || searchInput.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    let isCancelled = false;

    const timeout = setTimeout(async () => {
      try {
        const payload = await getRecipesCatalog({
          q: searchInput.trim(),
          limit: 5,
        });

        const rawRecipes = Array.isArray(payload?.recipes) ? payload.recipes : [];
        const mappedResults = rawRecipes.map((recipe) => ({
          id: recipe.id,
          slug: recipe.slug,
          title: recipe.titre || "Recette sans titre",
          mediaTitle: recipe.media?.titre || "",
          image: recipe.media?.posterUrl || recipe.imageURL || "/img/placeholder.jpg",
        }));

        if (!isCancelled) {
          setSearchResults(mappedResults);
        }
      } catch {
        if (!isCancelled) {
          setSearchResults([]);
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [searchInput]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = (event) => {
      setIsMobileViewport(event.matches);
    };

    setIsMobileViewport(mediaQuery.matches);
    mediaQuery.addEventListener("change", updateViewport);

    return () => {
      mediaQuery.removeEventListener("change", updateViewport);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilterChange = (filter) => {
    const nextParams = new URLSearchParams(searchParams);

    if (filter.value === "Tous") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", filter.key);
    }

    nextParams.delete("page");
    setSearchParams(nextParams, { replace: true, preventScrollReset: true });
    setCurrentPage(1);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    const normalized = searchInput.trim();

    if (normalized) {
      nextParams.set("q", normalized);
    } else {
      nextParams.delete("q");
    }

    nextParams.delete("page");
    setSearchParams(nextParams, { replace: true, preventScrollReset: true });
    setSearchResults([]);
    setCurrentPage(1);
  };

  const handleLimitChange = (event) => {
    setCurrentLimit(Number(event.target.value));
    setCurrentPage(1);
  };

  const handleMobileLimitChange = (limit) => {
    setCurrentLimit(limit);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("q");
    setSearchInput("");
    setSearchResults([]);
    setSearchParams(nextParams, { replace: true, preventScrollReset: true });
    setCurrentPage(1);
  };

  const handleSuggestionClick = () => {
    setSearchResults([]);
    setSearchInput("");
  };

  const openMobileSearchModal = () => {
    window.dispatchEvent(new CustomEvent("open-mobile-search", {
      detail: { search: searchInput },
    }));
  };

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <img
          src="/img/hero-home.png"
          alt="Catalogue des recettes"
          className={styles.heroImage}
        />

        <div className={styles.heroOverlay} />

        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Cuisine le cinéma,
            <br />
            Savoure les séries.
          </h1>

          <p className={styles.heroSubtitle}>
            Découvre le catalogue complet des recettes inspirées des films et séries cultes.
          </p>

          <Link className={styles.cta} to="/contact">
            Nous contacter
          </Link>
        </div>
      </section>

      <section className={styles.catalogue}>
        <div className={styles.catalogueInner}>
          <div className={styles.filters} aria-label="Filtrer les recettes par catégorie">
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  className={`${styles.filterPill} ${isActive ? styles.active : ""} ${styles[filter.key] || ""}`}
                  onClick={() => handleFilterChange(filter)}
                  aria-pressed={isActive}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className={styles.titleRow}>
            <h2 className={styles.title}>Catalogue des recettes</h2>
            <span className={styles.titleLine} />
          </div>

          <div className={styles.toolbar}>
            <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
              <div ref={searchRef} className={styles.searchField}>
                {isMobileViewport && (
                  <button
                    type="button"
                    className={styles.mobileSearchLauncher}
                    onClick={openMobileSearchModal}
                    aria-label="Ouvrir la recherche"
                  >
                    <img src="/icon/Search.svg" alt="" aria-hidden="true" className={styles.mobileSearchIcon} />
                  </button>
                )}
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className={styles.searchInput}
                  placeholder="Rechercher une recette, un film, une serie"
                  aria-label="Rechercher dans le catalogue"
                  readOnly={isMobileViewport}
                  onFocus={isMobileViewport ? openMobileSearchModal : undefined}
                  onClick={isMobileViewport ? openMobileSearchModal : undefined}
                />
                {searchInput && (
                  <button
                    type="button"
                    className={styles.clearSearchButton}
                    onClick={clearSearch}
                    aria-label="Effacer la recherche"
                  >
                    ×
                  </button>
                )}
                {searchResults.length > 0 && (
                  <ul className={styles.searchResults}>
                    {searchResults.map((recipe) => (
                      <li key={recipe.id} className={styles.searchResultItem}>
                        <Link
                          to={`/recipes/${recipe.slug || recipe.id}`}
                          onClick={handleSuggestionClick}
                        >
                          <img
                            src={recipe.image}
                            alt={recipe.title}
                            className={styles.searchResultThumb}
                          />
                          <span className={styles.searchResultCopy}>
                            <span>{recipe.title}</span>
                            {recipe.mediaTitle && (
                              <small className={styles.searchResultMeta}>{recipe.mediaTitle}</small>
                            )}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {!isMobileViewport && (
                <button type="submit" className={styles.searchButton}>Rechercher</button>
              )}
            </form>

            {isMobileViewport ? (
              <div className={styles.mobileLimitControl} aria-label="Nombre de recettes par page">
                <div className={styles.mobileLimitPills}>
                  {LIMIT_OPTIONS.map((limit) => {
                    const isActive = currentLimit === limit;

                    return (
                      <button
                        key={limit}
                        type="button"
                        className={`${styles.mobileLimitPill} ${isActive ? styles.mobileLimitPillActive : ""}`}
                        onClick={() => handleMobileLimitChange(limit)}
                        aria-pressed={isActive}
                      >
                        {limit}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <label className={styles.limitControl}>
                <span>Par page</span>
                <select value={currentLimit} onChange={handleLimitChange} className={styles.limitSelect}>
                  {LIMIT_OPTIONS.map((limit) => (
                    <option key={limit} value={limit}>{limit}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className={styles.summaryRow}>
            <p className={styles.summaryText}>
              {pagination.totalItems} recette{pagination.totalItems > 1 ? "s" : ""} trouvée
              {pagination.totalItems > 1 ? "s" : ""}
              {activeFilter !== "Tous" ? ` en ${activeFilter}` : ""}
              {currentQuery ? ` pour "${currentQuery}"` : ""}.
            </p>
            <div className={styles.summaryMeta}>
              <p className={styles.summaryText}>
                Page {pagination.page} sur {Math.max(1, pagination.totalPages || 1)}
              </p>
            </div>
          </div>

          {isLoading && <p>Chargement des recettes...</p>}
          {isPaginating && !isLoading && <p className={styles.loadingInline}>Mise à jour des recettes...</p>}
          {error && !isLoading && <p>{error}</p>}

          {!isLoading && !error && (
            <section className={styles.grid}>
              {recipes.length === 0 && (
                <p>Aucune recette disponible pour le moment.</p>
              )}

              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </section>
          )}

          {!isLoading && !error && pagination.totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Pagination du catalogue">
              <button
                type="button"
                className={styles.paginationButton}
                onClick={() => goToPage(pagination.page - 1)}
                disabled={!pagination.hasPreviousPage || isPaginating}
              >
                Précédent
              </button>

              <span className={styles.paginationStatus}>
                Page {pagination.page} / {pagination.totalPages}
              </span>

              <button
                type="button"
                className={styles.paginationButton}
                onClick={() => goToPage(pagination.page + 1)}
                disabled={!pagination.hasNextPage || isPaginating}
              >
                Suivant
              </button>
            </nav>
          )}
        </div>
      </section>
    </main>
  );
}
