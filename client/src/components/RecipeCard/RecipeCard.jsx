import { Link } from "react-router-dom";
import styles from "./RecipeCard.module.scss";

export default function RecipeCard({ recipe }) {
  if (!recipe) return null;

  const { id, image, title, category, mediaTitle, mediaType, duration } = recipe;
  const categoryKey = category?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const mediaTypeLabel = mediaType?.toLowerCase().startsWith("f") ? "F" : "S";

  return (
    <Link to={`/recipes/${recipe.slug || recipe.id}`} className={styles.cardLink}>
      <article className={`${styles.card} ${styles[categoryKey] || ""}`}>
        <div className={styles.imageWrapper}>
          <img src={image} alt={title} className={styles.image} />
          <span className={`${styles.category} ${styles[categoryKey] || ""}`}>{category}</span>
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <span className={styles.divider} />

          <div className={styles.metaArea}>
            <div className={styles.metaColumn}>
              <div className={styles.infoRow}>
                <span
                  className={`${styles.icon} ${styles.movieIcon}`}
                  aria-hidden="true"
                />
                <span className={styles.metaText}>{mediaTitle}</span>
              </div>

              <div className={styles.infoRow}>
                <span
                  className={`${styles.icon} ${styles.timeIcon}`}
                  aria-hidden="true"
                />
                <span className={styles.metaText}>{duration} min</span>
              </div>
            </div>

            <span className={styles.mediaType}>{mediaTypeLabel}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
