import { Link } from "react-router-dom";
import styles from "./CategorieCard.module.scss";

export default function CategoryCard({ category }) {
  const { name, slug, image, label, cta } = category;

  return (
    <article className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>{name}</h2>
        <span className={styles.line} />
      </div>

      <Link to={`/recipes?category=${slug}`} className={styles.card}>
        <img src={image} alt={name} className={styles.image} />
        <span className={`${styles.badge} ${styles[slug]}`}>{label}</span>
        <span className={styles.cta}>{cta}</span>
      </Link>
    </article>
  );
}
