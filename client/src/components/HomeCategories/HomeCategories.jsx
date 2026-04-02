import { useEffect, useState } from "react";
import { getRecipeCategories } from "../../services/recipesService";
import categoriesMock from "../../data/categories.mock";
import CategoryCard from "../CategorieCard";
import styles from "./HomeCategories.module.scss";

// Images prédéfinies pour les catégories connues
const IMAGE_BY_SLUG = {
  entree: "/img/entrees.png",
  entrees: "/img/entrees.png",
  plat: "/img/plats.png",
  plats: "/img/plats.png",
  dessert: "/img/desserts.png",
  desserts: "/img/desserts.png",
  boisson: "/img/Boissons.png",
  boissons: "/img/Boissons.png",
};

const FALLBACK_IMAGE = "/img/hero-home.png";

function toSlug(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapApiCategoryToCard(category) {
  const slug = toSlug(category.name);
  return {
    id: category.id,
    name: category.name,
    slug,
    image: IMAGE_BY_SLUG[slug] ?? FALLBACK_IMAGE,
    label: category.name,
    color: category.color ?? null,
    cta: `Découvrez nos ${category.name.toLowerCase()}`,
  };
}

export default function HomeCategories() {
  const [categories, setCategories] = useState(() => categoriesMock);

  useEffect(() => {
    let isMounted = true;

    getRecipeCategories()
      .then((payload) => {
        if (!isMounted) return;
        const raw = Array.isArray(payload) ? payload : payload?.data ?? [];
        if (raw.length === 0) return;
        setCategories(raw.map(mapApiCategoryToCard));
      })
      .catch(() => {
        // Fallback silencieux sur le mock en cas d'erreur
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className={styles.container}>
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </section>
  );
}