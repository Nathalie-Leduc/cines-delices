import { Link } from "react-router-dom";
import styles from "./CategorieCard.module.scss";

// Correspondance slug → clé CSS (gère singulier/pluriel)
const CSS_KEY_MAP = {
  entree: "entrees",
  plat: "plats",
  dessert: "desserts",
  boisson: "boissons",
};

export default function CategoryCard({ category }) {
  const { name, slug, image, label, cta, color } = category;

  const cssKey = CSS_KEY_MAP[slug] ?? slug;
  const knownClass = styles[cssKey];
  const badgeClass = `${styles.badge} ${knownClass ?? ""}`.trim();
  const badgeStyle = !knownClass && color ? { background: color } : undefined;

  return (
    <article className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>{name}</h2>
        <span className={styles.line} />
      </div>

      <Link to={`/recipes?category=${slug}`} className={styles.card}>
                <img src={image} alt={`Catégorie ${name}`} className={styles.image} loading="lazy" />
        <span className={badgeClass} style={badgeStyle}>{label}</span>
        <span className={styles.cta}>{cta}</span>
      </Link>
    </article>
  );
}
