export const fetchMedia = async (type, search = '') => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const url = search
      ? `${apiUrl}/api/tmdb/medias/search?searchTerm=${encodeURIComponent(search)}`
      : `${apiUrl}/api/tmdb/medias/${type}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des médias');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.results ?? [];
  } catch (error) {
    if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
      console.error('fetchMedia failed:', error);
    }

    return [];
  }
};
