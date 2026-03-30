export const MEDIA_SUGGESTION_POSTER_FALLBACK = '/img/placeholder.jpg';

export function normalizeTmdbSearchResult(item) {
  return {
    id: item?.id,
    title: item?.title || item?.titre || item?.name || item?.nom || '',
    type: item?.type || item?.mediaType || item?.media_type || '',
    poster: item?.poster || item?.posterUrl || null,
    year: item?.year || null,
    overview: item?.overview || null,
  };
}

export function getMediaSuggestionMeta(item) {
  const normalizedType = String(item?.type || '').toLowerCase();
  const typeLabel = normalizedType === 'movie'
    ? 'Film'
    : normalizedType === 'tv' || normalizedType === 'series' || normalizedType === 'serie' || normalizedType === 'série'
      ? 'Série'
      : 'Média';

  return [typeLabel, item?.year].filter(Boolean).join(' · ');
}
