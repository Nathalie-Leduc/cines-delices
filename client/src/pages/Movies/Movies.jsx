import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import styles from "../RecipesPage/RecipesPage.module.scss";
import FilmCard from "../../components/FilmCard";
import { getMoviesCatalog } from "../../services/mediaService";

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

function mapApiMovieToCard(movie) {
  return {
    id: movie?.id,
    title: movie?.title || "Film sans titre",
    poster: movie?.poster || "/img/parrain-poster.png",
    fallbackPoster: "/img/parrain-poster.png",
    genre: movie?.genre || "Genre non renseigné",
    director: movie?.director || "Réalisateur non renseigné",
  };
}

export default function Movies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
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
        const payload = await getMoviesCatalog({
          q: searchInput.trim(),
          limit: 5,
          page: 1,
        });

        if (!isCancelled) {
          const rawMovies = Array.isArray(payload?.movies) ? payload.movies : [];
          setSearchResults(rawMovies.map(mapApiMovieToCard));
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
  }, [searchInput]);

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

    const fetchMovies = async () => {
      try {
        setIsLoading(!hasLoadedOnce.current);
        setIsPaginating(hasLoadedOnce.current);
        let payload;

        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            payload = await getMoviesCatalog({
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

        const rawMovies = Array.isArray(payload?.movies) ? payload.movies : [];
        const paginationPayload = payload?.pagination || {};

        setMovies(rawMovies.map(mapApiMovieToCard));
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

        setMovies([]);
        setPagination({
          page: currentPage,
          limit: currentLimit,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        });
        setError(fetchError?.message || "Impossible de charger les films.");
        hasLoadedOnce.current = true;
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsPaginating(false);
        }
      }
    };

    fetchMovies();

    return () => {
      isMounted = false;
    };
  }, [currentLimit, currentPage, currentQuery]);

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

  const hasResults = movies.length > 0;
  const hasQuery = Boolean(currentQuery);

  const handleSuggestionClick = (movieTitle) => {
    setSearchInput(movieTitle);
    setSearchResults([]);
    updateCatalogParams((nextParams) => {
      nextParams.set("q", movieTitle);
      nextParams.set("page", "1");
      nextParams.set("limit", String(currentLimit));
    });
  };

  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <img
          src="/img/fond-cinema-contact.png"
          alt="Catalogue des films"
          className={styles.heroImage}
          style={{ objectPosition: "center 38%" }}
        />

        <div className={styles.heroOverlay} />

        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Films
          </h1>

          <p className={styles.heroSubtitle}>
            Explore le catalogue des films qui nourrissent l’univers Cinés Délices.
          </p>

          <Link className={styles.cta} to="/contact">
            Nous contacter
          </Link>
        </div>
      </section>

      <section className={styles.catalogue}>
        <div className={styles.catalogueInner}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>Films</h2>
            <span className={styles.titleLine} />
          </div>

          <div className={styles.toolbar}>
            <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
              <div ref={searchRef} className={styles.searchField}>
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className={styles.searchInput}
                  placeholder="Rechercher un film"
                  aria-label="Rechercher un film"
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
                    {searchResults.map((movie) => (
                      <li key={movie.id} className={styles.searchResultItem}>
                        <button
                          type="button"
                          onClick={() => handleSuggestionClick(movie.title)}
                          className={styles.searchResultButton}
                        >
                          <img
                            src={movie.poster || movie.fallbackPoster}
                            alt={movie.title}
                            className={styles.searchResultThumb}
                          />
                          <span className={styles.searchResultCopy}>
                            <span>{movie.title}</span>
                            <small className={styles.searchResultMeta}>
                              {movie.genre || "Film"}
                            </small>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button type="submit" className={styles.searchButton}>Rechercher</button>
            </form>
          </div>

          <div className={styles.summaryRow}>
            <p className={styles.summaryText}>
              {pagination.totalItems} film{pagination.totalItems > 1 ? "s" : ""} trouvé
              {pagination.totalItems > 1 ? "s" : ""}
              {hasQuery ? ` pour "${currentQuery}"` : ""}.
            </p>
            <div className={styles.summaryMeta}>
              <p className={styles.summaryText}>
                Page {pagination.page} sur {Math.max(1, pagination.totalPages || 1)}
              </p>
            </div>
          </div>

          {isLoading && <p>Chargement des films...</p>}
          {isPaginating && !isLoading && <p className={styles.loadingInline}>Mise à jour des films...</p>}
          {error && !isLoading && <p>{error}</p>}

          {!isLoading && !error && (
            <section className={styles.grid}>
              {!hasResults && (
                <p>{hasQuery ? "Aucun film ne correspond à votre recherche." : "Aucun film disponible pour le moment."}</p>
              )}

              {movies.map((movie) => (
                <FilmCard key={movie.id} film={movie} />
              ))}
            </section>
          )}

          {!isLoading && !error && pagination.totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Pagination du catalogue films">
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
