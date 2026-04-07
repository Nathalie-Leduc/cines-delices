import styles from "./FilmCard.module.scss";

const FILM_POSTER_FALLBACK = "/img/parrain-poster.webp";

export default function FilmCard({ film }) {
  if (!film) return null;

  const {
    title,
    poster,
    fallbackPoster,
    genre,
    director,
  } = film;

  const handleImageError = (event) => {
    const nextSource = event.currentTarget.dataset.fallbackSrc || FILM_POSTER_FALLBACK;

    if (event.currentTarget.src.endsWith(nextSource)) {
      return;
    }

    event.currentTarget.src = nextSource;
  };

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <img
          src={poster || fallbackPoster || FILM_POSTER_FALLBACK}
          alt={title}
          className={styles.image}
          data-fallback-src={fallbackPoster || FILM_POSTER_FALLBACK}
          onError={handleImageError}
        />
        <span className={styles.badge}>Film</span>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.divider} />

        <div className={styles.metaColumn}>
          <div className={styles.infoRow}>
            <span className={`${styles.icon} ${styles.genreIcon}`} aria-hidden="true" />
            <span className={styles.metaText}>{genre || "Genre non renseigné"}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={`${styles.icon} ${styles.directorIcon}`} aria-hidden="true" />
            <span className={styles.metaText}>{director || "Réalisateur non renseigné"}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
