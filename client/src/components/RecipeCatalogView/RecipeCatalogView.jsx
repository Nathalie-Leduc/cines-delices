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

export default function RecipeCatalogView({
  heroImage,
  heroAlt,
  heroTitle,
  heroSubtitle,
  heroObjectPosition,
  ctaTo,
  ctaLabel,
  catalogTitle,
  searchPlaceholder = "Rechercher une recette, un film, une serie",
  searchAriaLabel = "Rechercher dans le catalogue",
  loadingMessage = "Chargement des recettes...",
  updatingMessage = "Mise à jour des recettes...",
  errorFallbackMessage = "Impossible de charger les recettes.",
  emptyMessage = "Aucune recette disponible pour le moment.",
  buildSummaryText = buildDefaultSummaryText,
  getCatalog,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [recipes, setRecipes] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const isHeroVisible = useHeroReveal();

  const categoryParam = searchParams.get("category")?.toLowerCase() || "";
  const currentQuery = searchParams.get("q")?.trim() || "";
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
        const payload = await getCatalog({
          page: currentPage,
          limit: currentLimit,
          category: activeFilter !== "Tous" ? activeFilter : undefined,
          q: currentQuery || undefined,
        });
        const rawRecipes = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.recipes)
            ? payload.recipes
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

        if (!isMounted) return;

        const mappedRecipes = rawRecipes.map(mapApiRecipeToCard);
        setRecipes(activeFilter === "Tous" ? mixRecipesByCategory(mappedRecipes) : mappedRecipes);
        setPagination({
          page: Number(payload?.pagination?.page || currentPage),
          limit: Number(payload?.pagination?.limit || currentLimit),
          totalItems: Number(payload?.pagination?.totalItems || 0),
          totalPages: Number(payload?.pagination?.totalPages || 0),
          hasNextPage: Boolean(payload?.pagination?.hasNextPage),
          hasPreviousPage: Boolean(payload?.pagination?.hasPreviousPage),
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
        setError(fetchError?.message || errorFallbackMessage);
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
  }, [activeFilter, currentLimit, currentPage, currentQuery, errorFallbackMessage, getCatalog]);

  useEffect(() => {
    if (!searchInput || searchInput.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    let isCancelled = false;

    const timeout = setTimeout(async () => {
      try {
        const payload = await getCatalog({
          q: searchInput.trim(),
          limit: 5,
        });

        const rawRecipes = Array.isArray(payload?.recipes) ? payload.recipes : [];
        const mappedResults = rawRecipes.map((recipe) => ({
          id: recipe.id,
          slug: recipe.slug,
          title: recipe.titre || "Recette sans titre",
          mediaTitle: recipe.media?.titre || "",
          image: recipe.imageURL || recipe.imageUrl || "/img/hero-home.png",
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
  }, [getCatalog, searchInput]);

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

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const normalized = searchInput.trim();
    updateCatalogParams((nextParams) => {
      if (normalized) {
        nextParams.set("q", normalized);
      } else {
        nextParams.delete("q");
      }

      nextParams.set("page", "1");
      nextParams.set("limit", String(currentLimit));
    });
    setSearchResults([]);
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
    setSearchResults([]);
    updateCatalogParams((nextParams) => {
      nextParams.delete("q");
      nextParams.set("page", "1");
      nextParams.set("limit", String(currentLimit));
    });
  };

  const handleSuggestionClick = () => {
    setSearchResults([]);
    setSearchInput("");
  };

  const openMobileSearchModal = () => {
    setIsMobileSearchOpen(true);
  };

  const closeMobileSearchModal = () => {
    setIsMobileSearchOpen(false);
    setSearchResults([]);
  };

  const goToPage = (page) => {
    updateCatalogParams((nextParams) => {
      nextParams.set("page", String(page));
      nextParams.set("limit", String(currentLimit));
    });
  };

  const summaryText = buildSummaryText({
    totalItems: pagination.totalItems,
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
              <div ref={searchRef} className={styles.searchField}>
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
                  onChange={(event) => setSearchInput(event.target.value)}
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
                {!isMobileViewport && searchResults.length > 0 && (
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
                        onChange={(event) => setSearchInput(event.target.value)}
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

                    {searchResults.length > 0 && (
                      <ul className={styles.catalogMobileSearchResults}>
                        {searchResults.map((recipe) => (
                          <li key={recipe.id} className={styles.searchResultItem}>
                            <Link
                              to={`/recipes/${recipe.slug || recipe.id}`}
                              onClick={() => {
                                handleSuggestionClick();
                                closeMobileSearchModal();
                              }}
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
          {isPaginating && !isLoading && (
            <StatusBlock
              variant="loading"
              title={updatingMessage}
              size="compact"
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
          {isPaginating && !isLoading && <p className={styles.loadingInline}>{updatingMessage}</p>}
          {error && !isLoading && <p>{error}</p>}

          {!isLoading && !error && (
            <section className={styles.grid}>
              {recipes.length === 0 && (
                <StatusBlock
                  variant="empty"
                  title={currentQuery ? "Aucune recette trouvée" : "Aucune recette publiée"}
                  message={currentQuery
                    ? `Aucune recette ne correspond à "${currentQuery}". Essaie un autre mot-clé ou un autre filtre.`
                    : emptyMessage}
                  className={styles.gridState}
                />
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
