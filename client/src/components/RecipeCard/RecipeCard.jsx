import { Link } from "react-router-dom";
import { formatMinutes } from '../../utils/recipeUtils.js';
import styles from "./RecipeCard.module.scss";

export default function RecipeCard({ recipe, to, linkState }) {
  if (!recipe) return null;

  const { id, image, title, category, mediaTitle, mediaType, duration } = recipe;
  const categoryKey = category?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const mediaTypeLabel = mediaType?.toLowerCase().startsWith("f") ? "F" : "S";
  const targetPath = to || `/recipes/${recipe.slug || recipe.id}`;

  return (
    <Link to={targetPath} state={linkState} className={styles.cardLink}>
      <article className={`${styles.card} ${styles[categoryKey] || ""}`}>
        <div className={styles.imageWrapper}>
          {image ? (
            <img
              src={image}
              alt={title}
              className={styles.image}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className={styles.imagePlaceholder} aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.placeholderIcon}>
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </div>
          )}
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
                <span className={styles.metaText}>{formatMinutes(duration)}</span>
              </div>
            </div>

            <span className={styles.mediaType}>{mediaTypeLabel}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
