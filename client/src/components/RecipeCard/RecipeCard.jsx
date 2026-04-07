import { Link } from "react-router-dom";
import styles from "./RecipeCard.module.scss";

const RECIPE_IMAGE_FALLBACK = "/img/hero-home.webp";

export default function RecipeCard({ recipe, to, linkState }) {
  if (!recipe) return null;

  const { id, image, fallbackImage, title, category, mediaTitle, mediaType, duration } = recipe;
  const categoryKey = category?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const mediaTypeLabel = mediaType?.toLowerCase().startsWith("f") ? "F" : "S";
  const targetPath = to || `/recipes/${recipe.slug || recipe.id}`;

  const handleImageError = (event) => {
    const nextSource = event.currentTarget.dataset.fallbackSrc || RECIPE_IMAGE_FALLBACK;

    if (event.currentTarget.src.endsWith(nextSource)) {
      return;
    }

    event.currentTarget.src = nextSource;
  };

  return (
    <Link to={targetPath} state={linkState} className={styles.cardLink}>
      <article className={`${styles.card} ${styles[categoryKey] || ""}`}>
        <div className={styles.imageWrapper}>
          <img
            src={image || fallbackImage || RECIPE_IMAGE_FALLBACK}
            alt={title}
            className={styles.image}
            data-fallback-src={fallbackImage || RECIPE_IMAGE_FALLBACK}
            onError={handleImageError}
          />
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
