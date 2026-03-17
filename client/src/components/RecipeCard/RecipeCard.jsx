import styles from "./RecipeCard.module.scss";

export default function RecipeCard({ recipe }) {
  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={recipe.image} alt={recipe.title} />
        <span className={styles.category}>{recipe.category}</span>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{recipe.title}</h3>

        <p className={styles.meta}>
          {recipe.mediaType} • {recipe.mediaTitle}
        </p>

        <p className={styles.duration}>
          ⏱ {recipe.duration} min
        </p>
      </div>
    </article>
  );
}