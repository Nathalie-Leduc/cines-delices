export const mapMedia = (item, type, extra = {}) => ({
  id: item.id,
  type: item.media_type || type,
  title: item.title || item.name,
  overview: item.overview || "Pas de description",
  poster: item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : null,
  year: (item.release_date || item.first_air_date)?.slice(0, 4),
  genre: Array.isArray(item.genres) ? item.genres.map((genre) => genre?.name).filter(Boolean).join(", ") : null,
  ...extra,
});
