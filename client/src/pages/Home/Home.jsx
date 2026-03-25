import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HomeCategories from "../../components/HomeCategories";
import RecipeCard from "../../components/RecipeCard";
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

function Home() {
  const [latestRecipes, setLatestRecipes] = useState([]);
  const [isLoadingLatestRecipes, setIsLoadingLatestRecipes] = useState(true);
  const [latestRecipesError, setLatestRecipesError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchLatestRecipes = async () => {
      try {
        const payload = await getRecipesCatalog({ limit: 6 });
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

  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <img
          src="/img/hero-home.png"
          alt="CinéDélices"
          className={styles.heroImage}
        />

        <div className={styles.heroOverlay} />

        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Cuisine le cinéma,
            <br />
            Savoure les séries.
          </h1>

          <p className={styles.subtitle}>
            Découvre les recettes inspirées des films et séries cultes.
          </p>

          <Link className={styles.cta} to="/recipes">
            Découvrez nos recettes
          </Link>
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
          Les 6 dernières recettes validées, directement servies depuis l&apos;API.
        </p>

        {isLoadingLatestRecipes ? (
          <p className={styles.latestStatus}>Chargement des dernières recettes…</p>
        ) : latestRecipesError ? (
          <p className={styles.latestError}>{latestRecipesError}</p>
        ) : latestRecipes.length === 0 ? (
          <p className={styles.latestStatus}>Aucune recette publiée pour le moment.</p>
        ) : (
          <div className={styles.latestGrid}>
            {latestRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </section>

      <HomeCategories />
    </main>
  );
}

export default Home;
