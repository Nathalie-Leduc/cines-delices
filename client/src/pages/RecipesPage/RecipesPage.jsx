import styles from "./RecipesPage.module.scss";
import recipesMock from "../../data/recipes.mock";
import RecipeCard from "../../components/RecipeCard";

export default function RecipesPage() {
  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Catalogue des recettes</h1>

      <section className={styles.grid}>
        {recipesMock.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </section>
    </main>
  );
}