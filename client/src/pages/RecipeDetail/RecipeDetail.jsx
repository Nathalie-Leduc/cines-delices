import { useNavigate, useParams } from "react-router-dom";
import recipesMock from "../../data/recipes.mock";
import RecipeCard from "../../components/RecipeCard";
import styles from "./RecipeDetail.module.scss";

const DEFAULT_STEPS = [
  "Prépare tous les ingrédients et organise ton plan de travail avant de commencer.",
  "Lance les cuissons principales en surveillant les textures et l’assaisonnement.",
  "Assemble la recette progressivement pour garder équilibre et gourmandise.",
  "Dresse soigneusement puis sers immédiatement pour profiter de toutes les saveurs.",
];

function normalizeCategory(category) {
  return category?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
}

export default function RecipeDetail() {
  const navigate = useNavigate();
  const { slug } = useParams();

  const recipe = recipesMock.find((r) => r.slug === slug);

  if (!recipe) {
    return (
      <main className={styles.page}>
        <div className={styles.contentWrap}>
          <p className={styles.notFound}>Recette introuvable.</p>
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
    : ["400g de spaghetti", "3 tomates", "2 gousses d’ail", "Huile d’olive", "Basilic frais"];
  const recipeSteps = steps?.length ? steps : DEFAULT_STEPS;
  const recipePrepTime = prepTime ?? Math.max(10, Math.round((duration ?? 30) / 3));
  const recipeCookTime = cookTime ?? Math.max(15, Math.round((duration ?? 30) / 1.5));
  const recipeTotalTime = totalTime ?? duration ?? recipePrepTime + recipeCookTime;
  const recipeServings = servings ?? 4;
  const recipeDirector = director ?? "Studio original";
  const recipeYear = year ?? 2010;
  const recipeGenre = genre ?? "Cuisine fiction";
  const recipeDescription = description ?? `Une recette inspirée de l’univers de ${mediaTitle}, pensée pour retrouver à table l’ambiance du ${mediaType}.`;

  const similarRecipes = recipesMock
    .filter((r) => r.category === category && r.slug !== recipeSlug)
    .slice(0, 2);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <img
          src={heroImage || image || "/img/placeholder.jpg"}
          alt={title}
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay} />

        <div className={styles.contentWrap}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate(-1)}
          >
            <span className={styles.backArrow} aria-hidden="true">←</span>
            <span>Retour</span>
          </button>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.heroBadge}>
              Inspiré de <span>{mediaTitle}</span>
            </p>
          </div>
          <span className={`${styles.categoryTag} ${styles[categoryKey] || ""}`}>{category}</span>
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
