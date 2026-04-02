import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import StatusBlock from "../../components/StatusBlock/StatusBlock.jsx";
import MediaCard from "../../components/MediaCard";
import useHeroReveal from "../../hooks/useHeroReveal";
import styles from "../RecipesPage/RecipesPage.module.scss";

const DEFAULT_LIMIT = 15;
const LIMIT_OPTIONS = [6, 9, 12, 15];

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function MediaCatalog({
  title,
  heroImage,
  heroAlt,
  heroObjectPosition,
  heroSubtitle,
  searchPlaceholder,
  singularLabel,
  pluralLabel,
  badgeLabel,
  badgeVariant = "film",
  creatorFallback,
  loadingMessage,
  updatingMessage,
  errorMessage,
  emptyMessage,
  suggestionMetaFallback,
  getCatalog,
  mapItemToCard,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
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
  const hasLoadedOnce = useRef(false);
  const searchRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const isHeroVisible = useHeroReveal();

  const currentQuery = searchParams.get("q")?.trim() || "";
  const currentPage = parsePositiveInt(searchParams.get("page"), 1);
  const currentLimit = parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT);

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
    setSearchInput(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    if (!searchInput || searchInput.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    let isCancelled = false;

    const timeout = window.setTimeout(async () => {
      try {
        const payload = await getCatalog({
          q: searchInput.trim(),
          limit: 5,
          page: 1,
        });

        const rawItems = Array.isArray(payload?.items) ? payload.items : [];

        if (!isCancelled) {
          setSearchResults(rawItems.map(mapItemToCard));
        }
      } catch {
        if (!isCancelled) {
          setSearchResults([]);
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeout);
    };
  }, [getCatalog, mapItemToCard, searchInput]);

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
    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
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

  useEffect(() => {
    let isMounted = true;

    const fetchItems = async () => {
      try {
        setIsLoading(!hasLoadedOnce.current);
        setIsPaginating(hasLoadedOnce.current);
        let payload;

        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            payload = await getCatalog({
              page: currentPage,
              limit: currentLimit,
              q: currentQuery,
            });
            break;
          } catch (attemptError) {
            if (attempt === 1) {
              throw attemptError;
            }

            await wait(400);
          }
        }

        if (!isMounted) return;

        const rawItems = Array.isArray(payload?.items) ? payload.items : [];
        const paginationPayload = payload?.pagination || {};

        setItems(rawItems.map(mapItemToCard));
        setPagination({
          page: Number(paginationPayload.page || currentPage),
          limit: Number(paginationPayload.limit || currentLimit),
          totalItems: Number(paginationPayload.totalItems || 0),
          totalPages: Number(paginationPayload.totalPages || 0),
          hasNextPage: Boolean(paginationPayload.hasNextPage),
          hasPreviousPage: Boolean(paginationPayload.hasPreviousPage),
        });
        setError("");
        hasLoadedOnce.current = true;
      } catch (fetchError) {
        if (!isMounted) return;

        setItems([]);
        setPagination({
          page: currentPage,
          limit: currentLimit,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        });
        setError(fetchError?.message || errorMessage);
        hasLoadedOnce.current = true;
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsPaginating(false);
        }
      }
    };

    fetchItems();

    return () => {
      isMounted = false;
    };
  }, [currentLimit, currentPage, currentQuery, errorMessage, getCatalog, mapItemToCard]);

  const updateCatalogParams = (mutateParams) => {
    const nextParams = new URLSearchParams(searchParams);
    mutateParams(nextParams);
    setSearchParams(nextParams, { replace: true, preventScrollReset: true });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const normalized = searchInput.trim();
    setSearchResults([]);

    updateCatalogParams((nextParams) => {
      if (normalized) {
        nextParams.set("q", normalized);
      } else {
        nextParams.delete("q");
      }

      nextParams.set("page", "1");
      nextParams.set("limit", String(currentLimit));
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

  const goToPage = (page) => {
    updateCatalogParams((nextParams) => {
      nextParams.set("page", String(page));
      nextParams.set("limit", String(currentLimit));
    });
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

  const handleSuggestionClick = (itemTitle) => {
    setSearchInput(itemTitle);
    setSearchResults([]);
    updateCatalogParams((nextParams) => {
      nextParams.set("q", itemTitle);
      nextParams.set("page", "1");
      nextParams.set("limit", String(currentLimit));
    });
  };

  const openMobileSearch = () => {
    setIsMobileSearchOpen(true);
  };

  const closeMobileSearch = () => {
    setIsMobileSearchOpen(false);
    setSearchResults([]);
  };

  const handleSearchInputChange = (event) => {
    const nextValue = event.target.value;
    setSearchInput(nextValue);

    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = window.setTimeout(() => {
      const normalized = nextValue.trim();

      updateCatalogParams((nextParams) => {
        if (normalized) {
          nextParams.set("q", normalized);
        } else {
          nextParams.delete("q");
        }

        nextParams.set("page", "1");
        nextParams.set("limit", String(currentLimit));
      });
    }, 250);
  };

  const hasResults = items.length > 0;
  const hasQuery = Boolean(currentQuery);

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
            <h1 className={`${styles.heroTitle} ${styles.heroReveal} ${styles.heroRevealDelay1} ${isHeroVisible ? styles.heroRevealVisible : ""}`.trim()}>{title}</h1>

            <p className={`${styles.heroSubtitle} ${styles.heroReveal} ${styles.heroRevealDelay2} ${isHeroVisible ? styles.heroRevealVisible : ""}`.trim()}>
              {heroSubtitle}
            </p>

            <Link
              className={`${styles.cta} ${styles.heroReveal} ${styles.heroRevealDelay3} ${isHeroVisible ? styles.heroRevealVisible : ""}`.trim()}
              to="/contact"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.catalogue}>
        <div className={styles.catalogueInner}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{title}</h2>
            <span className={styles.titleLine} />
          </div>

          <div className={styles.toolbar}>
            <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
              <div ref={searchRef} className={styles.searchField}>
                {isMobileViewport ? (
                  <button
                    type="button"
                    className={styles.mobileSearchLauncher}
                    onClick={openMobileSearch}
                    aria-label="Ouvrir la recherche"
                  >
                    <img src="/icon/Search.svg" alt="" aria-hidden="true" className={styles.mobileSearchIcon} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className={styles.searchSubmitButton}
                    aria-label="Lancer la recherche"
                  />
                )}
                <input
                  type="search"
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  className={styles.searchInput}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  readOnly={isMobileViewport}
                  onFocus={isMobileViewport ? openMobileSearch : undefined}
                  onClick={isMobileViewport ? openMobileSearch : undefined}
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
                    {searchResults.map((item) => (
                      <li key={item.id} className={styles.searchResultItem}>
                        {item.to ? (
                          <Link to={item.to} onClick={() => setSearchResults([])}>
                            <img
                              src={item.poster || item.fallbackPoster}
                              alt={item.title}
                              className={styles.searchResultThumb}
                            />
                            <span className={styles.searchResultCopy}>
                              <span>{item.title}</span>
                              <small className={styles.searchResultMeta}>
                                {item.genre || suggestionMetaFallback}
                              </small>
                            </span>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSuggestionClick(item.title)}
                            className={styles.searchResultButton}
                          >
                            <img
                              src={item.poster || item.fallbackPoster}
                              alt={item.title}
                              className={styles.searchResultThumb}
                            />
                            <span className={styles.searchResultCopy}>
                              <span>{item.title}</span>
                              <small className={styles.searchResultMeta}>
                                {item.genre || suggestionMetaFallback}
                              </small>
                            </span>
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </form>

            {isMobileViewport ? (
              <div className={styles.mobileLimitControl} aria-label={`Nombre de ${pluralLabel} par page`}>
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
                onClick={closeMobileSearch}
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
                    onClick={closeMobileSearch}
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
                        onChange={handleSearchInputChange}
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
                        {searchResults.map((item) => (
                          <li key={item.id} className={styles.searchResultItem}>
                            {item.to ? (
                              <Link to={item.to} onClick={closeMobileSearch}>
                                <img
                                  src={item.poster || item.fallbackPoster}
                                  alt={item.title}
                                  className={styles.searchResultThumb}
                                />
                                <span className={styles.searchResultCopy}>
                                  <span>{item.title}</span>
                                  <small className={styles.searchResultMeta}>
                                    {item.genre || suggestionMetaFallback}
                                  </small>
                                </span>
                              </Link>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  handleSuggestionClick(item.title);
                                  closeMobileSearch();
                                }}
                                className={styles.searchResultButton}
                              >
                                <img
                                  src={item.poster || item.fallbackPoster}
                                  alt={item.title}
                                  className={styles.searchResultThumb}
                                />
                                <span className={styles.searchResultCopy}>
                                  <span>{item.title}</span>
                                  <small className={styles.searchResultMeta}>
                                    {item.genre || suggestionMetaFallback}
                                  </small>
                                </span>
                              </button>
                            )}
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
            <p className={styles.summaryText}>
              {pagination.totalItems} {pagination.totalItems > 1 ? pluralLabel : singularLabel} trouvé
              {pagination.totalItems > 1 ? "s" : ""}
              {hasQuery ? ` pour "${currentQuery}"` : ""}.
            </p>
            <div className={styles.summaryMeta}>
              <p className={styles.summaryText}>
                Page {pagination.page} sur {Math.max(1, pagination.totalPages || 1)}
              </p>
            </div>
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
              title={`Catalogue ${title.toLowerCase()} indisponible`}
              message={error}
              fallbackMessage={errorMessage}
              className={styles.catalogState}
            />
          )}

          {!isLoading && !error && (
            <section className={styles.grid}>
              {!hasResults && (
                <StatusBlock
                  variant="empty"
                  title={hasQuery ? `Aucun ${singularLabel} trouvé` : `Aucun ${singularLabel} disponible`}
                  message={hasQuery
                    ? `Aucun ${singularLabel} ne correspond à "${currentQuery}". Essaie une autre recherche.`
                    : emptyMessage}
                  className={styles.gridState}
                />
              )}

              {items.map((item) => (
                <MediaCard
                  key={item.id}
                  media={item}
                  badgeLabel={badgeLabel}
                  badgeVariant={badgeVariant}
                  creatorFallback={creatorFallback}
                />
              ))}
            </section>
          )}

          {!isLoading && !error && pagination.totalPages > 1 && (
            <nav className={styles.pagination} aria-label={`Pagination du catalogue ${title.toLowerCase()}`}>
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
