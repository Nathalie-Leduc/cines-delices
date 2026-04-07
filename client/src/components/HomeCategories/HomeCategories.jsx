import { useEffect, useState } from "react";
import { getRecipeCategories } from "../../services/recipesService";
import categoriesMock from "../../data/categories.mock";
import CategoryCard from "../CategorieCard";
import styles from "./HomeCategories.module.scss";

// Images prédéfinies pour les catégories connues
const IMAGE_BY_SLUG = {
  entree: "/img/entrees.webp",
  entrees: "/img/entrees.webp",
  plat: "/img/plats.webp",
  plats: "/img/plats.webp",
  dessert: "/img/desserts.webp",
  desserts: "/img/desserts.webp",
  boisson: "/img/Boissons.webp",
  boissons: "/img/Boissons.webp",
};

const FALLBACK_IMAGE = "/img/hero-home.webp";
const CATEGORY_ORDER = ["entree", "plat", "dessert", "boisson"];
const CATEGORY_ORDER_INDEX = new Map(CATEGORY_ORDER.map((key, index) => [key, index]));

function toSlug(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCategoryOrderKey(category) {
  const rawValue = category?.label || category?.name || category?.slug || "";
  const normalized = String(rawValue)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (normalized.startsWith("entree")) return "entree";
  if (normalized.startsWith("plat")) return "plat";
  if (normalized.startsWith("dessert")) return "dessert";
  if (normalized.startsWith("boisson")) return "boisson";

  return normalized;
}

export function sortHomeCategories(categories = []) {
  return categories
    .map((category, index) => ({ category, index }))
    .sort((left, right) => {
      const leftOrder = CATEGORY_ORDER_INDEX.get(normalizeCategoryOrderKey(left.category));
      const rightOrder = CATEGORY_ORDER_INDEX.get(normalizeCategoryOrderKey(right.category));

      if (leftOrder !== rightOrder) {
        if (leftOrder === undefined) return 1;
        if (rightOrder === undefined) return -1;
        return leftOrder - rightOrder;
      }

      return left.index - right.index;
    })
    .map(({ category }) => category);
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
  const [categories, setCategories] = useState(() => sortHomeCategories(categoriesMock));

  useEffect(() => {
    let isMounted = true;

    getRecipeCategories()
      .then((payload) => {
        if (!isMounted) return;
        const raw = Array.isArray(payload) ? payload : payload?.data ?? [];
        if (raw.length === 0) return;
        setCategories(sortHomeCategories(raw.map(mapApiCategoryToCard)));
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
