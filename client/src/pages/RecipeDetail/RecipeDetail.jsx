import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import RecipeCard from "../../components/RecipeCard";
import StatusBlock from "../../components/StatusBlock/StatusBlock.jsx";
import useHeroReveal from "../../hooks/useHeroReveal";
// 🔹 Import de getRecipeBySlug pour charger UNE recette (tâche f-04)
// 🔹 Import de getRecipesCatalog pour charger le catalogue (recettes similaires)
import { getRecipeBySlug, getRecipesCatalog } from "../../services/recipesService";
import styles from "./RecipeDetail.module.scss";

const DEFAULT_STEPS = [
  "Prépare tous les ingrédients et organise ton plan de travail avant de commencer.",
  "Lance les cuissons principales en surveillant les textures et l'assaisonnement.",
  "Assemble la recette progressivement pour garder équilibre et gourmandise.",
  "Dresse soigneusement puis sers immédiatement pour profiter de toutes les saveurs.",
];
const RECIPE_IMAGE_FALLBACK = "/img/hero-home.png";

function normalizeCategory(category) {
  return category?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
}

function normalizeCategoryLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "entree" || normalized === "entrée") return "Entrée";
  if (normalized === "plat") return "Plat";
  if (normalized === "dessert") return "Dessert";
  if (normalized === "boisson") return "Boisson";

  return value || "Autre";
}

function normalizeApiRecipe(apiRecipe) {
  const prep = Number(apiRecipe?.tempsPreparation);
  const cook = Number(apiRecipe?.tempsCuisson);
  const duration = [prep, cook].filter(Number.isFinite).reduce((sum, value) => sum + value, 0);

  const ingredients = (apiRecipe.ingredients || []).map((ingredient) => {
    if (typeof ingredient === 'string') return ingredient;
    const parts = [];
    if (ingredient.quantity || ingredient.quantite) parts.push(ingredient.quantity || ingredient.quantite);
    if (ingredient.unit || ingredient.unite) parts.push(ingredient.unit || ingredient.unite);
    parts.push(ingredient.name || ingredient.nom || ingredient.ingredient?.nom || '');
    return parts.join(' ').trim();
  });

  const steps =
    typeof apiRecipe.instructions === 'string'
      ? apiRecipe.instructions.split('\n').filter(Boolean)
      : Array.isArray(apiRecipe.steps)
        ? apiRecipe.steps
        : [];

  return {
    id: apiRecipe.id,
    slug: apiRecipe.slug,
    title: apiRecipe.title || apiRecipe.titre || 'Recette sans titre',
    category: normalizeCategoryLabel(apiRecipe.category?.nom || apiRecipe.category),
    image: apiRecipe.image || apiRecipe.imageURL || apiRecipe.imageUrl || '/img/hero-home.png',
    heroImage: apiRecipe.heroImage || apiRecipe.image || apiRecipe.imageURL || apiRecipe.imageUrl || '/img/hero-home.png',
    posterImage: apiRecipe.posterImage || apiRecipe.media?.posterUrl || apiRecipe.image || apiRecipe.imageURL || apiRecipe.imageUrl || '/img/hero-home.png',
    mediaTitle: apiRecipe.mediaTitle || apiRecipe.movie || apiRecipe.media?.titre || '',
    mediaType: apiRecipe.mediaType || (apiRecipe.media?.type === 'SERIES' ? 'serie' : 'film'),
    duration,
    description: apiRecipe.description,
    director: apiRecipe.director,
    year: apiRecipe.year,
    genre: apiRecipe.genre,
    servings: apiRecipe.servings ?? apiRecipe.nbPersonnes ?? undefined,
    prepTime: apiRecipe.prepTime ?? apiRecipe.tempsPreparation ?? undefined,
    cookTime: apiRecipe.cookTime ?? apiRecipe.tempsCuisson ?? undefined,
    ingredients,
    steps,
  };
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

export default function RecipeDetail() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { slug } = useParams();
  const isHeroVisible = useHeroReveal();
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  function handleImageError(event) {
    if (event.currentTarget.dataset.fallbackApplied === "true") {
      return;
    }

    event.currentTarget.dataset.fallbackApplied = "true";
    event.currentTarget.src = RECIPE_IMAGE_FALLBACK;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Tâche f-04 : on ne charge plus tout le catalogue d'un coup.
  //
  // Analogie restaurant :
  //   1️⃣  On commande le plat principal (getRecipeBySlug) → la recette demandée
  //   2️⃣  On jette un œil à la carte (getRecipesCatalog) → pour suggérer
  //       des recettes similaires de la même catégorie
  //   Si la carte est indisponible, pas grave : on a quand même notre plat.
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    // Si on a déjà la recette depuis la navigation (state), pas besoin de fetch
    if (state?.recipe) {
      setIsLoading(false);
      return;
    }

    const fetchRecipe = async () => {
      try {
        // 1️⃣ Charger la recette demandée (le plat principal)
        //    request() dans api.js lance déjà une erreur si !response.ok
        //    → donc si on arrive ici sans erreur, c'est que tout va bien
        const data = await getRecipeBySlug(slug);
        if (!isMounted) return;

        if (!data) {
          navigate('/404', { replace: true });
          return;
        }

        // On met d'abord la recette principale dans le state
        setRecipes([data]);

        // 2️⃣ Charger le catalogue pour les recettes similaires (l'étalage du marché)
        //    On enveloppe dans un try/catch séparé car si ça échoue,
        //    on veut quand même afficher la recette principale
        try {
          const catalog = await getRecipesCatalog();
          if (!isMounted) return;

          // catalog peut être un tableau OU un objet { recipes: [...] }
          // selon la réponse du back → on gère les deux cas
          const allRecipes = Array.isArray(catalog) ? catalog : (catalog.recipes || []);

          // On fusionne : la recette détaillée + le reste du catalogue (sans doublon)
          setRecipes([data, ...allRecipes.filter((r) => r.slug !== slug)]);
        } catch {
          // Pas grave si les similaires échouent — on a la recette principale
          console.warn('Impossible de charger les recettes similaires');
        }

        setError('');
      } catch (err) {
        if (!isMounted) return;

        // Si c'est un 404, on redirige vers la page Not Found
        // err.status est enrichi par request() dans api.js
        if (err.status === 404) {
          navigate('/404', { replace: true });
          return;
        }

        setError(err?.message || 'Impossible de charger la recette.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchRecipe();

    // Cleanup : si le composant est démonté avant la fin du fetch,
    // on ne met pas à jour le state (évite les erreurs React)
    return () => { isMounted = false; };
  }, [slug, state]);

  const recipe = useMemo(() => {
    const apiRecipe = recipes.find((item) => item.slug === slug);

    if (apiRecipe) {
      return normalizeApiRecipe(apiRecipe);
    }

    if (state?.recipe) {
      return normalizeApiRecipe(state.recipe);
    }

    return null;
  }, [recipes, slug, state]);

  const similarRecipes = useMemo(() => (
    recipes
      .filter((item) => item.slug !== slug)
      .filter((item) => normalizeCategoryLabel(item?.category?.nom) === recipe?.category)
      .slice(0, 2)
      .map(mapApiRecipeToCard)
  ), [recipes, slug, recipe?.category]);

  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.contentWrap}>
          <StatusBlock
            variant="loading"
            title="Chargement de la recette"
            className={styles.detailState}
          />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.page}>
        <div className={styles.contentWrap}>
          <StatusBlock
            variant="error"
            title="Recette indisponible"
            message={error}
            fallbackMessage="Nous n’avons pas pu charger cette recette. Réessaie dans quelques instants."
            className={styles.detailState}
          />
        </div>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className={styles.page}>
        <div className={styles.contentWrap}>
          <StatusBlock
            variant="empty"
            title="Recette introuvable"
            message="Cette recette n’est plus disponible ou son lien est incomplet."
            className={styles.detailState}
          />
        </div>
      </main>
    );
  }

  const {
    title,
    slug: recipeSlug,
    category,
    mediaTitle,
    mediaType,
    duration,
    image,
    heroImage,
    posterImage,
    description,
    servings,
    prepTime,
    cookTime,
    totalTime,
    director,
    year,
    genre,
    ingredients,
    steps,
  } = recipe;

  const categoryKey = normalizeCategory(category);
  const mediaTypeLabel = mediaType?.toLowerCase().startsWith("f") ? "F" : "S";
  const recipeIngredients = ingredients?.length
    ? ingredients
    : ["400g de spaghetti", "3 tomates", "2 gousses d'ail", "Huile d'olive", "Basilic frais"];
  const recipeSteps = steps?.length ? steps : DEFAULT_STEPS;
  const recipePrepTime = prepTime ?? Math.max(10, Math.round((duration ?? 30) / 3));
  const recipeCookTime = cookTime ?? Math.max(15, Math.round((duration ?? 30) / 1.5));
  const recipeTotalTime = totalTime ?? duration ?? recipePrepTime + recipeCookTime;
  const recipeServings = servings ?? 4;
  const recipeDirector = director ?? "Studio original";
  const recipeYear = year ?? 2010;
  const recipeGenre = genre ?? "Cuisine fiction";
  const recipeDescription = description ?? `Une recette inspirée de l'univers de ${mediaTitle}, pensée pour retrouver à table l'ambiance du ${mediaType}.`;
  const canEditFromMemberSpace = Boolean(state?.fromMemberRecipes);

  function handleOpenMemberEditForm() {
    const targetRecipeId = state?.openEditRecipeId || recipe?.id;

    navigate("/membre/mes-recettes", {
      state: targetRecipeId ? { openEditRecipeId: targetRecipeId } : null,
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <img
          src={heroImage || image || "/img/placeholder.jpg"}
          alt={title}
          className={styles.heroImage}
          onError={handleImageError}
        />
        <div className={styles.heroOverlay} />

        <div className={styles.contentWrap}>
          <button
            type="button"
            className={`${styles.backButton} ${styles.heroReveal} ${styles.heroRevealDelay1} ${isHeroVisible ? styles.heroRevealVisible : ""}`.trim()}
            onClick={() => navigate(-1)}
          >
            <span className={styles.backArrow} aria-hidden="true">←</span>
            <span>Retour</span>
          </button>

          {canEditFromMemberSpace && (
            <button
              type="button"
              className={`${styles.editFromDetailButton} ${styles.heroReveal} ${styles.heroRevealDelay1} ${isHeroVisible ? styles.heroRevealVisible : ""}`.trim()}
              onClick={handleOpenMemberEditForm}
              title="Ouvrir le formulaire de modification"
            >
              Modifier ma recette
            </button>
          )}

          <div className={styles.heroContent}>
            <h1 className={`${styles.title} ${styles.heroReveal} ${styles.heroRevealDelay2} ${isHeroVisible ? styles.heroRevealVisible : ""}`.trim()}>{title}</h1>
            <p className={`${styles.heroBadge} ${styles.heroReveal} ${styles.heroRevealDelay3} ${isHeroVisible ? styles.heroRevealVisible : ""}`.trim()}>
              Inspiré de <span>{mediaTitle}</span>
            </p>
          </div>
          <span className={`${styles.categoryTag} ${styles.heroReveal} ${styles.heroRevealDelay4} ${isHeroVisible ? styles.heroRevealVisible : ""} ${styles[categoryKey] || ""}`.trim()}>{category}</span>
        </div>
      </section>

      <section className={styles.metaStrip}>
        <div className={styles.contentWrap}>
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={`${styles.metaIcon} ${styles.knifeIcon}`} aria-hidden="true" />
              <span>{recipePrepTime} min</span>
            </div>
            <div className={styles.metaDivider} />
            <div className={styles.metaItem}>
              <span className={`${styles.metaIcon} ${styles.cookingIcon}`} aria-hidden="true" />
              <span>{recipeCookTime} min</span>
            </div>
            <div className={styles.metaDivider} />
            <div className={styles.metaItem}>
              <span className={`${styles.metaIcon} ${styles.timeIcon}`} aria-hidden="true" />
              <span>{recipeTotalTime} min</span>
            </div>
            <div className={styles.metaDivider} />
            <div className={styles.metaItem}>
              <span className={`${styles.metaIcon} ${styles.groupIcon}`} aria-hidden="true" />
              <span>{recipeServings} personnes</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.mainSection}>
        <div className={styles.contentWrap}>
          <div className={styles.layout}>
            <section className={`${styles.section} ${styles.ingredientsSection}`}>
              <div className={styles.sectionHeading}>
                <h2 className={styles.sectionTitle}>Ingrédients</h2>
                <span className={styles.sectionLine} />
              </div>

              <ul className={styles.ingredientsList}>
                {recipeIngredients.map((ingredient, index) => (
                  <li key={`${ingredient}-${index}`} className={styles.ingredientItem}>
                    <span className={styles.ingredientDot} aria-hidden="true" />
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={`${styles.mediaCard} ${styles.mediaSection}`}>
              <div className={styles.mediaTop}>
                <span className={styles.mediaBadge}>
                  <span className={`${styles.mediaBadgeIcon} ${styles.movieBadgeIcon}`} aria-hidden="true" />
                  {mediaTitle}
                </span>
                <span className={styles.mediaTypeBox}>{mediaTypeLabel}</span>
              </div>

              <div className={styles.mediaBody}>
                <img
                  src={posterImage || image || "/img/placeholder.jpg"}
                  alt={mediaTitle}
                  className={styles.mediaPoster}
                  onError={handleImageError}
                />

                <div className={styles.mediaCopy}>
                  <p><strong>Director :</strong> {recipeDirector}</p>
                  <p><strong>Année :</strong> {recipeYear}</p>
                  <p><strong>Genre :</strong> {recipeGenre}</p>

                  <h3 className={styles.synopsisTitle}>Synopsis :</h3>
                  <p className={styles.synopsisText}>{recipeDescription}</p>
                </div>
              </div>
            </section>

            <section className={`${styles.section} ${styles.stepsSection}`}>
              <div className={styles.sectionHeading}>
                <h2 className={styles.sectionTitle}>Étapes</h2>
                <span className={styles.sectionLine} />
              </div>

              <ol className={styles.stepsList}>
                {recipeSteps.map((step, index) => (
                  <li key={`${index + 1}-${step}`} className={styles.stepItem}>
                    <span className={styles.stepNumber}>{index + 1}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className={`${styles.section} ${styles.similarSection}`}>
              <div className={styles.sectionHeading}>
                <h2 className={styles.sectionTitle}>Recettes similaires</h2>
                <span className={styles.sectionLine} />
              </div>

              <div className={styles.similarGrid}>
                {similarRecipes.map((similarRecipe) => (
                  <RecipeCard key={similarRecipe.id} recipe={similarRecipe} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
