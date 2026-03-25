import styles from "./MediaCard.module.scss";

const MEDIA_POSTER_FALLBACK = "/img/parrain-poster.png";

export default function MediaCard({
  media,
  badgeLabel,
  creatorFallback,
  badgeVariant = "film",
}) {
  if (!media) return null;

  const {
    title,
    poster,
    fallbackPoster,
    genre,
    creator,
  } = media;

  const handleImageError = (event) => {
    const nextSource = event.currentTarget.dataset.fallbackSrc || MEDIA_POSTER_FALLBACK;

    if (event.currentTarget.src.endsWith(nextSource)) {
      return;
    }

    event.currentTarget.src = nextSource;
  };

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <img
          src={poster || fallbackPoster || MEDIA_POSTER_FALLBACK}
          alt={title}
          className={styles.image}
          data-fallback-src={fallbackPoster || MEDIA_POSTER_FALLBACK}
          onError={handleImageError}
        />
        <span className={`${styles.badge} ${styles[badgeVariant] || ""}`}>{badgeLabel}</span>
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
            <span className={`${styles.icon} ${styles.creatorIcon}`} aria-hidden="true" />
            <span className={styles.metaText}>{creator || creatorFallback}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
