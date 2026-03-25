import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import HomeCategories from "../../components/HomeCategories";
import RecipeCard from "../../components/RecipeCard";
import useHeroReveal from "../../hooks/useHeroReveal";
import { getRecipesCatalog } from "../../services/recipesService";
import styles from "./Home.module.scss";

function normalizeCategoryLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "entree" || normalized === "entrée") return "Entrée";
  if (normalized === "plat") return "Plat";
  if (normalized === "dessert") return "Dessert";
  if (normalized === "boisson") return "Boisson";

  return String(value || "").trim() || "Autre";
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
    image: recipe?.imageURL || recipe?.imageUrl || recipe?.media?.posterUrl || "/img/hero-home.png",
    fallbackImage: recipe?.media?.posterUrl || "/img/hero-home.png",
  };
}

function getVisibleSlides() {
  if (typeof window === "undefined") {
    return 1;
  }

  if (window.innerWidth >= 1200) {
    return 4;
  }

  if (window.innerWidth >= 768) {
    return 3;
  }

  return 1;
}

function Home() {
  const [latestRecipes, setLatestRecipes] = useState([]);
  const [isLoadingLatestRecipes, setIsLoadingLatestRecipes] = useState(true);
  const [latestRecipesError, setLatestRecipesError] = useState("");
  const [visibleSlides, setVisibleSlides] = useState(getVisibleSlides);
  const [carouselState, setCarouselState] = useState({ index: 0, direction: 1 });
  const [trackOffset, setTrackOffset] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const slideRefs = useRef([]);
  const isHeroVisible = useHeroReveal();

  const maxCarouselIndex = Math.max(0, latestRecipes.length - visibleSlides);

  useEffect(() => {
    let isMounted = true;

    const fetchLatestRecipes = async () => {
      try {
        const payload = await getRecipesCatalog({ limit: 10 });
        const rawRecipes = Array.isArray(payload?.recipes) ? payload.recipes : [];

        if (!isMounted) {
          return;
        }

        setLatestRecipes(rawRecipes.map(mapApiRecipeToCard));
        setLatestRecipesError("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLatestRecipes([]);
        setLatestRecipesError(error?.message || "Impossible de charger les dernières recettes.");
      } finally {
        if (isMounted) {
          setIsLoadingLatestRecipes(false);
        }
      }
    };

    fetchLatestRecipes();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setVisibleSlides(getVisibleSlides());
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setCarouselState((previous) => ({
      index: Math.min(previous.index, maxCarouselIndex),
      direction: maxCarouselIndex === 0 ? 1 : previous.direction,
    }));
  }, [maxCarouselIndex]);

  useEffect(() => {
    const activeSlide = slideRefs.current[carouselState.index];
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!activeSlide || !viewport || !track) {
      setTrackOffset(0);
      return;
    }

    const maxOffset = Math.max(0, track.scrollWidth - viewport.clientWidth);
    const nextOffset = Math.min(activeSlide.offsetLeft, maxOffset);

    setTrackOffset(nextOffset);
  }, [carouselState.index, latestRecipes.length, visibleSlides]);

  useEffect(() => {
    if (maxCarouselIndex === 0 || isCarouselPaused) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setCarouselState((previous) => {
        let nextIndex = previous.index + previous.direction;
        let nextDirection = previous.direction;

        if (nextIndex >= maxCarouselIndex) {
          nextIndex = maxCarouselIndex;
          nextDirection = -1;
        } else if (nextIndex <= 0) {
          nextIndex = 0;
          nextDirection = 1;
        }

        return {
          index: nextIndex,
          direction: nextDirection,
        };
      });
    }, 3200);

    return () => {
      window.clearInterval(interval);
    };
  }, [isCarouselPaused, maxCarouselIndex]);

  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <img
          src="/img/hero-home.png"
          alt="CinéDélices"
          className={styles.heroImage}
        />

        <div className={styles.heroOverlay} />

        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <h1 className={`${styles.title} ${styles.heroReveal} ${styles.heroRevealDelay1} ${isHeroVisible ? styles.heroRevealVisible : ""}`.trim()}>
              Cuisine le cinéma,
              <br />
              Savoure les séries.
            </h1>

            <p className={`${styles.subtitle} ${styles.heroReveal} ${styles.heroRevealDelay2} ${isHeroVisible ? styles.heroRevealVisible : ""}`.trim()}>
              Découvre les recettes inspirées des films et séries cultes.
            </p>

            <Link
              className={`${styles.cta} ${styles.heroReveal} ${styles.heroRevealDelay3} ${isHeroVisible ? styles.heroRevealVisible : ""}`.trim()}
              to="/recipes"
            >
              Découvrez nos recettes
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.latestSection}>
        <div className={styles.latestHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Nouveautés</p>
            <h2 className={styles.sectionTitle}>Dernières recettes publiées</h2>
          </div>
          <Link className={styles.secondaryLink} to="/recipes">
            Voir tout le catalogue
          </Link>
        </div>

        <p className={styles.sectionText}>
          Les 10 dernières recettes validées, directement servies depuis l&apos;API.
        </p>

        {isLoadingLatestRecipes ? (
          <p className={styles.latestStatus}>Chargement des dernières recettes…</p>
        ) : latestRecipesError ? (
          <p className={styles.latestError}>{latestRecipesError}</p>
        ) : latestRecipes.length === 0 ? (
          <p className={styles.latestStatus}>Aucune recette publiée pour le moment.</p>
        ) : (
          <div className={styles.latestCarousel}>
            <div
              ref={viewportRef}
              className={styles.latestViewport}
              onMouseEnter={() => setIsCarouselPaused(true)}
              onMouseLeave={() => setIsCarouselPaused(false)}
              onFocusCapture={() => setIsCarouselPaused(true)}
              onBlurCapture={() => setIsCarouselPaused(false)}
            >
              <div
                ref={trackRef}
                className={styles.latestTrack}
                style={{ transform: `translateX(-${trackOffset}px)` }}
              >
                {latestRecipes.map((recipe, index) => (
                  <div
                    key={recipe.id}
                    className={styles.latestSlide}
                    ref={(element) => {
                      slideRefs.current[index] = element;
                    }}
                  >
                    <RecipeCard recipe={recipe} />
                  </div>
                ))}
              </div>
            </div>

            {maxCarouselIndex > 0 ? (
              <div className={styles.carouselMeta} aria-hidden="true">
                <div className={styles.carouselDots}>
                  {Array.from({ length: maxCarouselIndex + 1 }).map((_, index) => (
                    <span
                      key={`dot-${index}`}
                      className={`${styles.carouselDot} ${index === carouselState.index ? styles.carouselDotActive : ""}`.trim()}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <HomeCategories />
    </main>
  );
}

export default Home;
