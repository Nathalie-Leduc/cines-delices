import { Link } from "react-router-dom";
import styles from "./RecipeCard.module.scss";

export default function RecipeCard({ recipe }) {
  if (!recipe) return null;

  const { id, image, title, category, mediaTitle, duration } = recipe;

  return (
    <Link to={`/recipes/${id}`} className={styles.cardLink}>
      <article className={styles.card}>
        <div className={styles.imageWrapper}>
          <img src={image} alt={title} className={styles.image} />
          <span className={styles.category}>{category}</span>
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>

          <div className={styles.infoRow}>
            <img
              src="/icon/Movie.svg"
              alt=""
              className={styles.icon}
              aria-hidden="true"
            />
            <span className={styles.metaText}>{mediaTitle}</span>
          </div>

          <div className={styles.infoRow}>
            <img
              src="/icon/Time.svg"
              alt=""
              className={styles.icon}
              aria-hidden="true"
            />
            <span className={styles.metaText}>{duration} min</span>
          </div>
        </div>
      </article>
    </Link>
  );
}