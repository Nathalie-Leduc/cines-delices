import {request} from './api.js';

export const fetchMedia = async (type, search = '') => {
  try {
    if (search) {
       // Recherche de médias via l'API backend
       return await request(`/api/tmdb/medias/search?searchTerm=${encodeURIComponent(search)}`);
      }else {
       // Récupération de tous les médias, filtrés par type si fourni
       return await request(type ? `/api/tmdb/medias/${type}` : '/api/tmdb/medias');
      }
    } catch (error) {
      // Affichage console uniquement en dev
      if (import.meta.env.DEV && import.meta.env.MODE !== 'test'){
        console.error('fetchMedia failed:', error)
      }
    }

    return [];
  };

