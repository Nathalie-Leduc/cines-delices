import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import HomeCategories from "../../components/HomeCategories";
import RecipeCard from "../../components/RecipeCard";
import useHeroReveal from "../../hooks/useHeroReveal";
import { getRecipesCatalog } from "../../services/recipesService";
import styles from "./Home.module.scss";

const CONCEPT_STEPS = [
  {
    step: "01",
    title: "Explore",
    text: "Parcours des recettes reliées à des films et séries cultes, avec un univers visuel pensé pour donner envie de cliquer.",
  },
  {
    step: "02",
    title: "Choisis",
    text: "Filtre selon ton envie du moment : entrée, plat, dessert ou boisson, puis trouve la recette qui te parle le plus.",
  },
  {
    step: "03",
    title: "Cuisine",
    text: "Retrouve les étapes, les ingrédients et le média associé pour prolonger l'expérience jusque dans l'assiette.",
  },
];

const CONCEPT_TAGS = [
  { label: "Films", to: "/films", variant: "film" },
  { label: "Séries", to: "/series", variant: "series" },
  { label: "Recettes", to: "/recipes", variant: "recipe" },
];

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
  const [isViewportPaused, setIsViewportPaused] = useState(false);
  const [isDraggingCarousel, setIsDraggingCarousel] = useState(false);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const slideRefs = useRef([]);
  const trackOffsetRef = useRef(0);
  const suppressClickRef = useRef(false);
  const suppressClickTimeoutRef = useRef(null);
  const conceptSectionRef = useRef(null);
  const dragStateRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    startOffset: 0,
    hasMoved: false,
    isHorizontalDrag: null,
  });
  const isHeroVisible = useHeroReveal();
  const [isConceptVisible, setIsConceptVisible] = useState(false);

  const maxCarouselIndex = Math.max(0, latestRecipes.length - visibleSlides);
  const isCarouselPaused = isViewportPaused || isDraggingCarousel;

  const getMaxTrackOffset = () => {
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!viewport || !track) {
      return 0;
    }

    return Math.max(0, track.scrollWidth - viewport.clientWidth);
  };

  const clampTrackOffset = (value) => Math.min(Math.max(value, 0), getMaxTrackOffset());

  const updateTrackOffset = (value) => {
    const nextOffset = clampTrackOffset(value);
    trackOffsetRef.current = nextOffset;
    setTrackOffset(nextOffset);
    return nextOffset;
  };

  const getClosestSlideIndex = (offset) => {
    if (maxCarouselIndex <= 0) {
      return 0;
    }

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index <= maxCarouselIndex; index += 1) {
      const slide = slideRefs.current[index];

      if (!slide) {
        continue;
      }

      const candidateOffset = clampTrackOffset(slide.offsetLeft);
      const distance = Math.abs(candidateOffset - offset);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    }

    return closestIndex;
  };

  const resetDragState = () => {
    dragStateRef.current = {
      pointerId: null,
      startX: 0,
      startY: 0,
      startOffset: 0,
      hasMoved: false,
      isHorizontalDrag: null,
    };
  };

  const stopDragging = (pointerId) => {
    const viewport = viewportRef.current;
    const { pointerId: activePointerId, hasMoved, isHorizontalDrag } = dragStateRef.current;

    if (activePointerId == null || (pointerId != null && pointerId !== activePointerId)) {
      return;
    }

    if (viewport?.hasPointerCapture?.(activePointerId)) {
      viewport.releasePointerCapture(activePointerId);
    }

    const nextOffset = trackOffsetRef.current;
    resetDragState();
    setIsDraggingCarousel(false);

    if (!hasMoved || !isHorizontalDrag) {
      return;
    }

    const nextIndex = getClosestSlideIndex(nextOffset);
    suppressClickRef.current = true;

    if (suppressClickTimeoutRef.current) {
      window.clearTimeout(suppressClickTimeoutRef.current);
    }

    suppressClickTimeoutRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 250);

    setCarouselState((previous) => ({
      index: nextIndex,
      direction: nextIndex >= previous.index ? 1 : -1,
    }));
  };

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
    const sectionElement = conceptSectionRef.current;

    if (!sectionElement) {
      return undefined;
    }

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsConceptVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        setIsConceptVisible(true);
        observer.disconnect();
      },
      {
        rootMargin: "-10% 0px",
        threshold: 0.18,
      },
    );

    observer.observe(sectionElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => () => {
    if (suppressClickTimeoutRef.current) {
      window.clearTimeout(suppressClickTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    setCarouselState((previous) => ({
      index: Math.min(previous.index, maxCarouselIndex),
      direction: maxCarouselIndex === 0 ? 1 : previous.direction,
    }));
  }, [maxCarouselIndex]);

  useEffect(() => {
    if (isDraggingCarousel) {
      return;
    }

    const activeSlide = slideRefs.current[carouselState.index];
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!activeSlide || !viewport || !track) {
      updateTrackOffset(0);
      return;
    }

    const nextOffset = clampTrackOffset(activeSlide.offsetLeft);

    updateTrackOffset(nextOffset);
  }, [carouselState.index, isDraggingCarousel, latestRecipes.length, visibleSlides]);

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

  const handleCarouselPointerDown = (event) => {
    if (maxCarouselIndex === 0) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    resetDragState();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: trackOffsetRef.current,
      hasMoved: false,
      isHorizontalDrag: null,
    };
  };

  const handleCarouselPointerMove = (event) => {
    const dragState = dragStateRef.current;

    if (dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (dragState.isHorizontalDrag == null) {
      if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) {
        return;
      }

      dragState.isHorizontalDrag = Math.abs(deltaX) > Math.abs(deltaY);

      if (!dragState.isHorizontalDrag) {
        stopDragging(event.pointerId);
        return;
      }

      viewportRef.current?.setPointerCapture?.(event.pointerId);
      setIsDraggingCarousel(true);
    }

    dragState.hasMoved = true;
    updateTrackOffset(dragState.startOffset - deltaX);
  };

  const handleCarouselPointerEnd = (event) => {
    stopDragging(event.pointerId);
  };

  const handleCarouselClickCapture = (event) => {
    if (!suppressClickRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

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

      <section
        ref={conceptSectionRef}
        className={styles.conceptSection}
        aria-label="Présentation du concept Cinés Délices"
      >
        <div className={styles.conceptShell}>
          <div className={styles.conceptBackdrop} aria-hidden="true" />

          <div className={styles.conceptContent}>
            <div className={styles.conceptCopy}>
              <p
                className={`${styles.sectionEyebrow} ${styles.conceptReveal} ${isConceptVisible ? styles.conceptRevealVisible : ""}`.trim()}
              >
                Le concept
              </p>
              <h2
                className={`${styles.conceptTitle} ${styles.conceptReveal} ${styles.conceptRevealDelay1} ${isConceptVisible ? styles.conceptRevealVisible : ""}`.trim()}
              >
                Le cinéma passe à table.
              </h2>
              <span
                className={`${styles.conceptAccent} ${isConceptVisible ? styles.conceptAccentVisible : ""}`.trim()}
                aria-hidden="true"
              />
              <p
                className={`${styles.conceptIntro} ${styles.conceptReveal} ${styles.conceptRevealDelay2} ${isConceptVisible ? styles.conceptRevealVisible : ""}`.trim()}
              >
                Cinés Délices te fait découvrir des recettes inspirées de films et séries
                cultes. Tu explores un univers, tu choisis une recette, puis tu la cuisines
                chez toi.
              </p>

              <div
                className={`${styles.conceptTags} ${styles.conceptReveal} ${styles.conceptRevealDelay3} ${isConceptVisible ? styles.conceptRevealVisible : ""}`.trim()}
              >
                {CONCEPT_TAGS.map((tag) => (
                  <Link
                    key={tag.to}
                    className={`${styles.conceptTag} ${styles[`conceptTag_${tag.variant}`]}`.trim()}
                    to={tag.to}
                  >
                    {tag.label}
                  </Link>
                ))}
              </div>
            </div>

            <div
              className={`${styles.conceptVisual} ${styles.conceptReveal} ${styles.conceptRevealDelay2} ${isConceptVisible ? styles.conceptRevealVisible : ""}`.trim()}
              aria-hidden="true"
            >
              <div className={styles.conceptVisualPanel}>
                <span className={styles.conceptVisualGlow} />
                <span className={styles.conceptVisualSpark} />

                <div className={styles.conceptClapper}>
                  <span className={styles.conceptClapperTop} />
                  <span className={styles.conceptClapperBody} />
                </div>

                <div className={styles.conceptFlames}>
                  <span className={styles.conceptFireGlow} />
                  <span className={`${styles.conceptFlame} ${styles.conceptFlame1}`} />
                  <span className={`${styles.conceptFlame} ${styles.conceptFlame2}`} />
                  <span className={`${styles.conceptFlame} ${styles.conceptFlame3}`} />
                </div>

                <div className={styles.conceptCookware}>
                  <span className={styles.conceptCookwareHandleLeft} />
                  <span className={styles.conceptCookwareHandleRight} />
                  <span className={styles.conceptCookwareLid} />
                  <span className={styles.conceptCookwareKnob} />
                  <span className={styles.conceptCookwareBody} />
                </div>

                <span className={`${styles.conceptSteam} ${styles.conceptSteam1}`} />
                <span className={`${styles.conceptSteam} ${styles.conceptSteam2}`} />
                <span className={`${styles.conceptSteam} ${styles.conceptSteam3}`} />
              </div>
            </div>

            <div className={styles.conceptSteps}>
              {CONCEPT_STEPS.map((item, index) => (
                <article
                  key={item.step}
                  className={`${styles.conceptStep} ${styles[`conceptStepDelay${index + 1}`]} ${isConceptVisible ? styles.conceptStepVisible : ""}`.trim()}
                >
                  <span className={styles.conceptStepNumber}>{item.step}</span>
                  <h3 className={styles.conceptStepTitle}>{item.title}</h3>
                  <p className={styles.conceptStepText}>{item.text}</p>
                </article>
              ))}
            </div>
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
              className={`${styles.latestViewport} ${isDraggingCarousel ? styles.latestViewportDragging : ""}`.trim()}
              onMouseEnter={() => setIsViewportPaused(true)}
              onMouseLeave={() => setIsViewportPaused(false)}
              onFocusCapture={() => setIsViewportPaused(true)}
              onBlurCapture={() => setIsViewportPaused(false)}
              onPointerDown={handleCarouselPointerDown}
              onPointerMove={handleCarouselPointerMove}
              onPointerUp={handleCarouselPointerEnd}
              onPointerCancel={handleCarouselPointerEnd}
              onLostPointerCapture={handleCarouselPointerEnd}
              onClickCapture={handleCarouselClickCapture}
            >
              <div
                ref={trackRef}
                className={`${styles.latestTrack} ${isDraggingCarousel ? styles.latestTrackDragging : ""}`.trim()}
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
