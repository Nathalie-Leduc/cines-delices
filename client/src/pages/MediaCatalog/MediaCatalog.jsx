import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import StatusBlock from "../../components/StatusBlock/StatusBlock.jsx";
import MediaCard from "../../components/MediaCard";
import useHeroReveal from "../../hooks/useHeroReveal";
import styles from "../RecipesPage/RecipesPage.module.scss";

const DEFAULT_LIMIT = 15;

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
  const hasLoadedOnce = useRef(false);
  const searchRef = useRef(null);
  const isHeroVisible = useHeroReveal();

  const currentQuery = searchParams.get("q")?.trim() || "";
  const currentPage = parsePositiveInt(searchParams.get("page"), 1);
  const currentLimit = parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT);

  useEffect(() => {
    setSearchInput(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    if (!searchInput || searchInput.trim().length < 2) {
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

  const handleSuggestionClick = (itemTitle) => {
    setSearchInput(itemTitle);
    setSearchResults([]);
    updateCatalogParams((nextParams) => {
      nextParams.set("q", itemTitle);
      nextParams.set("page", "1");
      nextParams.set("limit", String(currentLimit));
    });
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
                <span className={styles.searchFieldIcon} aria-hidden="true" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className={styles.searchInput}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
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
          </div>

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
