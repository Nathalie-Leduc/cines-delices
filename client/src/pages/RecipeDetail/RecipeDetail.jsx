import { useParams, useNavigate } from "react-router-dom";
import recipesMock from "../../data/recipes.mock";
import RecipeCard from "../../components/RecipeCard";
import styles from "./RecipeDetail.module.scss";

export default function RecipeDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const recipe = recipesMock.find((r) => r.slug === slug);

  if (!recipe) {
    return (
      <main className={styles.container}>
        <p>Recette introuvable</p>
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

  const similarRecipes = recipesMock
    .filter((r) => r.category === category && r.slug !== recipeSlug)
    .slice(0, 2);

  return (
    <main className={styles.container}>
      <button className={styles.back} onClick={() => navigate(-1)}>
        ← Retour
      </button>

      <section className={styles.hero}>
        <img
          src={image || "/img/placeholder.jpg"}
          alt={title}
          className={styles.heroImage}
        />

        <div className={styles.heroContent}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>
            Inspiré du {mediaType} {mediaTitle}
          </p>
          <span className={styles.category}>{category}</span>
        </div>
      </section>

      <section className={styles.metaStrip}>
        <div className={styles.metaItem}>{prepTime} min</div>
        <div className={styles.metaItem}>{cookTime} min</div>
        <div className={styles.metaItem}>{totalTime || duration} min</div>
        <div className={styles.metaItem}>{servings} personnes</div>
      </section>

      <section className={styles.mainContent}>
        <div className={styles.leftColumn}>
          <section className={styles.block}>
            <h2 className={styles.sectionTitle}>Ingrédients</h2>
            <ul className={styles.ingredientsList}>
              {ingredients?.map((ingredient, index) => (
                <li key={index} className={styles.ingredientItem}>
                  {ingredient}
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.block}>
            <h2 className={styles.sectionTitle}>Étapes</h2>
            <ol className={styles.stepsList}>
              {steps?.map((step, index) => (
                <li key={index} className={styles.stepItem}>
                  <span className={styles.stepNumber}>{index + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className={styles.rightColumn}>
          <section className={styles.block}>
            <span className={styles.mediaBadge}>{mediaTitle}</span>

            <div className={styles.mediaInfo}>
              <p>Director : {director}</p>
              <p>Année : {year}</p>
              <p>Genre : {genre}</p>
            </div>

            <div className={styles.synopsis}>
              <h2 className={styles.sectionTitle}>Synopsis</h2>
              <p>{description}</p>
            </div>
          </section>

          <section className={styles.block}>
            <h2 className={styles.sectionTitle}>Recettes similaires</h2>

            <div className={styles.similarGrid}>
              {similarRecipes.map((similarRecipe) => (
                <RecipeCard key={similarRecipe.id} recipe={similarRecipe} />
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}