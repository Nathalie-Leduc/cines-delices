import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import RecipeCard from "../RecipeCard";
import StatusBlock from "../StatusBlock/StatusBlock.jsx";
import useHeroReveal from "../../hooks/useHeroReveal";
import styles from "../../pages/RecipesPage/RecipesPage.module.scss";
import {
  buildCategoryFilters,
  CATEGORY_PARAM_TO_FILTER,
  FILTERS,
  LIMIT_OPTIONS,
  mapApiRecipeToCard,
  mixRecipesByCategory,
  parsePositiveInt,
} from "./recipeCatalog.shared";
import { getRecipeCategories } from "../../services/recipesService";

function buildDefaultSummaryText({ totalItems, activeFilter, currentQuery }) {
  return `${totalItems} recette${totalItems > 1 ? "s" : ""} trouvée${totalItems > 1 ? "s" : ""}${activeFilter !== "Tous" ? ` en ${activeFilter}` : ""}${currentQuery ? ` pour "${currentQuery}"` : ""}.`;
}

function extractRecipesFromPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.recipes)) {
    return payload.recipes;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

async function fetchCompleteCatalog(getCatalog) {
  const limit = 50;
  let page = 1;
  let totalPages = 1;
  const collectedRecipes = [];

  while (page <= totalPages) {
    const payload = await getCatalog({ page, limit });
    const rawRecipes = extractRecipesFromPayload(payload);

    collectedRecipes.push(...rawRecipes);

    if (Array.isArray(payload)) {
      break;
    }

    const pagination = payload?.pagination || {};
    totalPages = Math.max(1, Number(pagination.totalPages || 1));

    if (!pagination.hasNextPage || page >= totalPages) {
      break;
    }

    page += 1;
  }

  return Array.from(
    new Map(collectedRecipes.map((recipe) => [recipe?.id, recipe])).values(),
  );
}

export default function RecipeCatalogView({
  heroImage,
  heroAlt,
  heroTitle,
  heroSubtitle,
  heroObjectPosition,
  ctaTo,
  ctaLabel,
  catalogTitle,
  searchPlaceholder = "Rechercher une recette, un film, une série",
  searchAriaLabel = "Rechercher dans le catalogue",
  loadingMessage = "Chargement des recettes...",
  updatingMessage: _updatingMessage = "Mise à jour des recettes...",
  errorFallbackMessage = "Impossible de charger les recettes.",
  emptyMessage = "Aucune recette disponible pour le moment.",
  buildSummaryText = buildDefaultSummaryText,
  getCatalog,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [recipes, setRecipes] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.innerWidth <= 767);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef(null);
  const isHeroVisible = useHeroReveal();

  const categoryParam = searchParams.get("category")?.toLowerCase() || "";
  const currentPage = parsePositiveInt(searchParams.get("page"), 1);
  const currentLimit = parsePositiveInt(searchParams.get("limit"), 15);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const payload = await getRecipeCategories();
        if (!isMounted) return;

        const categories = Array.isArray(payload) ? payload : payload?.data ?? [];
        setAvailableCategories(categories);
      } catch {
        if (!isMounted) return;
        setAvailableCategories([]);
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const filters = useMemo(() => {
    const fallbackCategories = FILTERS
      .filter((filter) => filter.value !== "Tous")
      .map((filter) => filter.value);

    return buildCategoryFilters(
      availableCategories.length ? availableCategories : fallbackCategories,
    );
  }, [availableCategories]);

  const activeFilter = useMemo(() => {
    if (!categoryParam) {
      return "Tous";
    }

    const dynamicMatch = filters.find((filter) => filter.key === categoryParam);
    return dynamicMatch?.value || CATEGORY_PARAM_TO_FILTER[categoryParam] || "Tous";
  }, [filters, categoryParam]);

  const shouldUseMobileSearchOverlay = isMobileViewport;

  useEffect(() => {
    setSearchInput(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    const fetchRecipes = async () => {
      try {
        setIsLoading(true);
        const rawRecipes = await fetchCompleteCatalog(getCatalog);

        if (!isMounted) return;

        const mappedRecipes = rawRecipes.map(mapApiRecipeToCard);
        setRecipes(mappedRecipes);
        setError("");
      } catch (fetchError) {
        if (!isMounted) return;

        setRecipes([]);
        setError(fetchError?.message || errorFallbackMessage);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchRecipes();

    return () => {
      isMounted = false;
    };
  }, [errorFallbackMessage, getCatalog]);

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
    if (!isMobileSearchOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mobileSearchInputRef.current?.focus();

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMobileSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileSearchOpen]);

  const updateCatalogParams = (mutateParams) => {
    const nextParams = new URLSearchParams(searchParams);
    mutateParams(nextParams);
    setSearchParams(nextParams, { replace: true, preventScrollReset: true });
  };

  const handleFilterChange = (filter) => {
    updateCatalogParams((nextParams) => {
      if (filter.value === "Tous") {
        nextParams.delete("category");
      } else {
        nextParams.set("category", filter.key);
      }

      nextParams.set("page", "1");
      nextParams.set("limit", String(currentLimit));
    });
  };

  const handleSearchChange = (value) => {
    setSearchInput(value);

    updateCatalogParams((nextParams) => {
      if (value.trim()) {
        nextParams.set("q", value);
      } else {
        nextParams.delete("q");
      }

      nextParams.set("page", "1");
      nextParams.set("limit", String(currentLimit));
    });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (isMobileViewport) {
      closeMobileSearchModal();
    }
  };

  const handleLimitChange = (event) => {
    const nextLimit = Number(event.target.value);
    updateCatalogParams((nextParams) => {
      nextParams.set("limit", String(nextLimit));
      nextParams.set("page", "1");
    });
  };

  const handleMobileLimitChange = (limit) => {
    updateCatalogParams((nextParams) => {
      nextParams.set("limit", String(limit));
      nextParams.set("page", "1");
    });
  };

  const clearSearch = () => {
    setSearchInput("");
    updateCatalogParams((nextParams) => {
      nextParams.delete("q");
      nextParams.set("page", "1");
      nextParams.set("limit", String(currentLimit));
    });
  };

  const openMobileSearchModal = () => {
    setIsMobileSearchOpen(true);
  };

  const closeMobileSearchModal = () => {
    setIsMobileSearchOpen(false);
  };

  const goToPage = (page) => {
    updateCatalogParams((nextParams) => {
      nextParams.set("page", String(page));
      nextParams.set("limit", String(currentLimit));
    });
  };

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = searchInput.trim().toLowerCase();

    const visibleRecipes = recipes.filter((recipe) => {
      const matchesFilter = activeFilter === "Tous" || recipe.category === activeFilter;
      const matchesQuery = !normalizedQuery
        || String(recipe?.title || "").toLowerCase().includes(normalizedQuery)
        || String(recipe?.mediaTitle || "").toLowerCase().includes(normalizedQuery)
        || String(recipe?.category || "").toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });

    return activeFilter === "Tous" ? mixRecipesByCategory(visibleRecipes) : visibleRecipes;
  }, [activeFilter, recipes, searchInput]);

  const totalRecipes = filteredRecipes.length;
  const totalPages = Math.max(1, Math.ceil(totalRecipes / currentLimit));
  const paginatedRecipes = useMemo(() => {
    const startIndex = (currentPage - 1) * currentLimit;
    return filteredRecipes.slice(startIndex, startIndex + currentLimit);
  }, [currentLimit, currentPage, filteredRecipes]);

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const currentQuery = searchInput.trim();

  useEffect(() => {
    if (currentPage > totalPages) {
      updateCatalogParams((nextParams) => {
        nextParams.set("page", String(totalPages));
        nextParams.set("limit", String(currentLimit));
      });
    }
  }, [currentLimit, currentPage, totalPages]);

  const summaryText = buildSummaryText({
    totalItems: totalRecipes,
    activeFilter,
    currentQuery,
  });

  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <img
          src={heroImage}
          alt={heroAlt}
          className={styles.heroImage}
          style={heroObjectPosition ? { objectPosition: heroObjectPosition } : undefined}
        />

        <div className={styles.heroOverlay} />

        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <h1 className={`${styles.heroTitle} ${styles.heroReveal} ${styles.heroRevealDelay1} ${isHeroVisible ? styles.heroRevealVisible : ""}`.trim()}>
              {heroTitle}
            </h1>

            <p className={`${styles.heroSubtitle} ${styles.heroReveal} ${styles.heroRevealDelay2} ${isHeroVisible ? styles.heroRevealVisible : ""}`.trim()}>
              {heroSubtitle}
            </p>

            {ctaTo && ctaLabel && (
              <Link
                className={`${styles.cta} ${styles.heroReveal} ${styles.heroRevealDelay3} ${isHeroVisible ? styles.heroRevealVisible : ""}`.trim()}
                to={ctaTo}
              >
                {ctaLabel}
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className={styles.catalogue}>
        <div className={styles.catalogueInner}>
          <div className={styles.filters} aria-label="Filtrer les recettes par catégorie">
            {filters.map((filter) => {
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
            <h2 className={styles.title}>{catalogTitle}</h2>
            <span className={styles.titleLine} />
          </div>

          <div className={styles.toolbar}>
            <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
              <div className={styles.searchField}>
                {shouldUseMobileSearchOverlay && (
                  <button
                    type="button"
                    className={styles.mobileSearchLauncher}
                    onClick={openMobileSearchModal}
                    aria-label="Ouvrir la recherche"
                  >
                    <img src="/icon/Search.svg" alt="" aria-hidden="true" className={styles.mobileSearchIcon} />
                  </button>
                )}
                <span className={styles.searchFieldIcon} aria-hidden="true" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  className={styles.searchInput}
                  placeholder={searchPlaceholder}
                  aria-label={searchAriaLabel}
                  readOnly={shouldUseMobileSearchOverlay}
                  onFocus={shouldUseMobileSearchOverlay ? openMobileSearchModal : undefined}
                  onClick={shouldUseMobileSearchOverlay ? openMobileSearchModal : undefined}
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
              </div>
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

          {isMobileViewport && (
            <div
              className={`${styles.catalogMobileSearchOverlay} ${isMobileSearchOpen ? styles.catalogMobileSearchOverlayVisible : ""}`}
              aria-hidden={!isMobileSearchOpen}
            >
              <button
                type="button"
                className={styles.catalogMobileSearchBackdrop}
                aria-label="Fermer la recherche"
                onClick={closeMobileSearchModal}
              />

              <section className={`${styles.catalogMobileSearchModal} ${isMobileSearchOpen ? styles.catalogMobileSearchModalOpen : ""}`} aria-label="Recherche rapide">
                <div className={styles.catalogMobileSearchHeader}>
                  <div className={styles.catalogMobileSearchTitleRow}>
                    <p className={styles.catalogMobileSearchEyebrow}>Recherche rapide</p>
                    <span className={styles.catalogMobileSearchTitleLine} />
                  </div>
                  <button
                    type="button"
                    className={styles.catalogMobileSearchCloseButton}
                    aria-label="Fermer la recherche"
                    onClick={closeMobileSearchModal}
                  >
                    <img src="/icon/close_menu.svg" alt="Fermer" />
                  </button>
                </div>

                <div className={styles.catalogMobileSearchContent}>
                  <form className={styles.catalogMobileSearchForm} onSubmit={handleSearchSubmit}>
                    <div className={styles.catalogMobileSearchField}>
                      <img src="/icon/Search.svg" alt="" aria-hidden="true" className={styles.catalogMobileSearchIcon} />
                      <input
                        ref={mobileSearchInputRef}
                        type="search"
                        value={searchInput}
                        onChange={(event) => handleSearchChange(event.target.value)}
                        placeholder={searchPlaceholder}
                        className={styles.catalogMobileSearchInput}
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
                    </div>
                  </form>
                </div>
              </section>
            </div>
          )}

          <div className={styles.summaryRow}>
            <p className={styles.summaryText}>{summaryText}</p>
          </div>

          {isLoading && (
            <StatusBlock
              variant="loading"
              title={loadingMessage}
              className={styles.catalogState}
            />
          )}
          {error && !isLoading && (
            <StatusBlock
              variant="error"
              title="Catalogue indisponible"
              message={error}
              fallbackMessage={errorFallbackMessage}
              className={styles.catalogState}
            />
          )}
          {isLoading && <p>{loadingMessage}</p>}
          {error && !isLoading && <p>{error}</p>}

          {!isLoading && !error && (
            <section className={styles.grid}>
              {paginatedRecipes.length === 0 && (
                <StatusBlock
                  variant="empty"
                  title={currentQuery ? "Aucune recette trouvée" : "Aucune recette publiée"}
                  message={currentQuery
                    ? `Aucune recette ne correspond à "${currentQuery}". Essaie un autre mot-clé ou un autre filtre.`
                    : emptyMessage}
                  className={styles.gridState}
                />
              )}
              {paginatedRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </section>
          )}

          {!isLoading && !error && totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Pagination du catalogue">
              <button
                type="button"
                className={styles.paginationButton}
                onClick={() => goToPage(currentPage - 1)}
                disabled={!hasPreviousPage}
              >
                Précédent
              </button>

              <span className={styles.paginationStatus}>
                Page {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                className={styles.paginationButton}
                onClick={() => goToPage(currentPage + 1)}
                disabled={!hasNextPage}
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
