import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import styles from "./RecipesPage.module.scss";
import RecipeCard from "../../components/RecipeCard";
import { getRecipesCatalog } from "../../services/recipesService";

const FILTERS = [
  { label: "Tous", value: "Tous", key: "tous" },
  { label: "Entrée", value: "Entrée", key: "entree" },
  { label: "Plat", value: "Plat", key: "plat" },
  { label: "Dessert", value: "Dessert", key: "dessert" },
  { label: "Boisson", value: "Boisson", key: "boisson" },
];

const CATEGORY_PARAM_TO_FILTER = {
  entree: "Entrée",
  entrees: "Entrée",
  plat: "Plat",
  plats: "Plat",
  dessert: "Dessert",
  desserts: "Dessert",
  boisson: "Boisson",
  boissons: "Boisson",
};

function normalizeCategoryLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "entree" || normalized === "entrée") return "Entrée";
  if (normalized === "plat") return "Plat";
  if (normalized === "dessert") return "Dessert";
  if (normalized === "boisson") return "Boisson";

  return value || "Autre";
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
    image: recipe?.media?.posterUrl || "/img/placeholder.jpg",
  };
}

export default function RecipesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const categoryParam = searchParams.get("category")?.toLowerCase() || "";
  const activeFilter = CATEGORY_PARAM_TO_FILTER[categoryParam] || "Tous";

  useEffect(() => {
    let isMounted = true;

    const fetchRecipes = async () => {
      try {
        const payload = await getRecipesCatalog();
        const rawRecipes = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.recipes)              // ← ajouter ça
            ? payload.recipes
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

        if (!isMounted) return;

        setRecipes(rawRecipes.map(mapApiRecipeToCard));
        setError("");
      } catch (fetchError) {
        if (!isMounted) return;
        setRecipes([]);
        setError(fetchError?.message || "Impossible de charger les recettes.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchRecipes();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRecipes = useMemo(() => (
    activeFilter === "Tous"
      ? recipes
      : recipes.filter((recipe) => recipe.category === activeFilter)
  ), [activeFilter, recipes]);

  const handleFilterChange = (filter) => {
    if (filter.value === "Tous") {
      setSearchParams({});
      return;
    }

    setSearchParams({ category: filter.key });
  };

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
          <div className={styles.filters} aria-label="Filtrer les recettes par catégorie">
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  className={`${styles.filterPill} ${isActive ? styles.active : ""} ${styles[filter.key] || ""}`}
                  onClick={() => handleFilterChange(filter)}
                  aria-pressed={isActive}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className={styles.titleRow}>
            <h2 className={styles.title}>Catalogue des recettes</h2>
            <span className={styles.titleLine} />
          </div>

          {isLoading && <p>Chargement des recettes...</p>}
          {error && !isLoading && <p>{error}</p>}

          {!isLoading && !error && (
            <section className={styles.grid}>
              {filteredRecipes.length === 0 && (
                <p>Aucune recette disponible pour le moment.</p>
              )}

              {filteredRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
