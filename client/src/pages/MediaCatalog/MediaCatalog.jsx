import { useEffect, useMemo, useRef, useState } from "react";
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

function extractItemsFromPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

async function fetchCompleteCatalog(getCatalog) {
  const limit = 50;
  let page = 1;
  let totalPages = 1;
  const collectedItems = [];

  while (page <= totalPages) {
    const payload = await getCatalog({ page, limit });
    const rawItems = extractItemsFromPayload(payload);

    collectedItems.push(...rawItems);

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
    new Map(collectedItems.map((item) => [item?.id, item])).values(),
  );
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
  updatingMessage: _updatingMessage,
  errorMessage,
  emptyMessage,
  suggestionMetaFallback: _suggestionMetaFallback,
  getCatalog,
  mapItemToCard,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.innerWidth <= 767);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef(null);
  const isHeroVisible = useHeroReveal();

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
        setIsLoading(true);
        const rawItems = await fetchCompleteCatalog(getCatalog);

        if (!isMounted) return;

        setItems(rawItems.map(mapItemToCard));
        setError("");
      } catch (fetchError) {
        if (!isMounted) return;

        setItems([]);
        setError(fetchError?.message || errorMessage);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchItems();

    return () => {
      isMounted = false;
    };
  }, [errorMessage, getCatalog, mapItemToCard]);

  const updateCatalogParams = (mutateParams) => {
    const nextParams = new URLSearchParams(searchParams);
    mutateParams(nextParams);
    setSearchParams(nextParams, { replace: true, preventScrollReset: true });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (isMobileViewport) {
      closeMobileSearch();
    }
  };

  const clearSearch = () => {
    setSearchInput("");
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

  const openMobileSearch = () => {
    setIsMobileSearchOpen(true);
  };

  const closeMobileSearch = () => {
    setIsMobileSearchOpen(false);
  };

  const handleSearchInputChange = (event) => {
    const nextValue = event.target.value;
    setSearchInput(nextValue);

    updateCatalogParams((nextParams) => {
      if (nextValue.trim()) {
        nextParams.set("q", nextValue);
      } else {
        nextParams.delete("q");
      }

      nextParams.set("page", "1");
      nextParams.set("limit", String(currentLimit));
    });
  };

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchInput.trim().toLowerCase();

    return items.filter((item) => {
      if (!normalizedQuery) {
        return true;
      }

      return String(item?.title || "").toLowerCase().includes(normalizedQuery);
    });
  }, [items, searchInput]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / currentLimit));
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * currentLimit;
    return filteredItems.slice(startIndex, startIndex + currentLimit);
  }, [currentLimit, currentPage, filteredItems]);
  const hasResults = paginatedItems.length > 0;
  const currentQuery = searchInput.trim();
  const hasQuery = Boolean(currentQuery);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  useEffect(() => {
    if (currentPage > totalPages) {
      updateCatalogParams((nextParams) => {
        nextParams.set("page", String(totalPages));
        nextParams.set("limit", String(currentLimit));
      });
    }
  }, [currentLimit, currentPage, totalPages]);

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
              <div className={styles.searchField}>
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
                  </form>
                </div>
              </section>
            </div>
          )}

          <div className={styles.summaryRow}>
            <p className={styles.summaryText}>
              {totalItems} {totalItems > 1 ? pluralLabel : singularLabel} trouvé
              {totalItems > 1 ? "s" : ""}
              {hasQuery ? ` pour "${currentQuery}"` : ""}.
            </p>
            <div className={styles.summaryMeta}>
              <p className={styles.summaryText}>
                Page {currentPage} sur {totalPages}
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

              {paginatedItems.map((item) => (
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

          {!isLoading && !error && totalPages > 1 && (
            <nav className={styles.pagination} aria-label={`Pagination du catalogue ${title.toLowerCase()}`}>
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
