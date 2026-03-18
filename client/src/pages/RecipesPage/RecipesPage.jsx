import { Link } from "react-router-dom";
import styles from "./RecipesPage.module.scss";
import recipesMock from "../../data/recipes.mock";
import RecipeCard from "../../components/RecipeCard";

export default function RecipesPage() {
  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <img
          src="/img/hero-home.png"
          alt="Catalogue des recettes"
          className={styles.heroImage}
        />

        <div className={styles.heroOverlay} />

        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Cuisine le cinéma,
            <br />
            Savoure les séries.
          </h1>

          <p className={styles.heroSubtitle}>
            Découvre le catalogue complet des recettes inspirées des films et séries cultes.
          </p>

          <Link className={styles.cta} to="/contact">
            Nous contacter
          </Link>
        </div>
      </section>

      <section className={styles.catalogue}>
        <div className={styles.catalogueInner}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>Catalogue des recettes</h2>
            <span className={styles.titleLine} />
          </div>

          <section className={styles.grid}>
            {recipesMock.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
