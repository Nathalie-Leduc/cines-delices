import dotenv from 'dotenv';
import { mapMedia } from '../mappers/mediaMapper.js';

dotenv.config();

async function fetchByType(type) {
  const response = await fetch(
    `${process.env.TMDB_BASE_URL}/discover/${type}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR`
  );

  if (!response.ok) {
    throw new Error(`Erreur TMDB ${type}`);
  }

  const data = await response.json();
  return data.results.map((item) => mapMedia(item, type));
}

export async function getAllMedias(req, res) {
  try {
    const type = req.params.type;
    let results;

    if (type === 'movie' || type === 'tv') {
      results = await fetchByType(type);
    } else {
      const [movies, tv] = await Promise.all([fetchByType('movie'), fetchByType('tv')]);
      results = [...movies, ...tv];
    }

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des médias' });
  }
}

export async function getMediaById(req, res) {
  try {
    const { type = 'movie', id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'ID requis' });
    }

    const response = await fetch(
      `${process.env.TMDB_BASE_URL}/${type}/${id}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR`
    );

    if (!response.ok) {
      throw new Error('Erreur TMDB by ID');
    }

    const data = await response.json();
    let director = null;

    if (type === 'movie') {
      const creditsResponse = await fetch(
        `${process.env.TMDB_BASE_URL}/movie/${id}/credits?api_key=${process.env.TMDB_API_KEY}&language=fr-FR`
      );

      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        const foundDirector = creditsData.crew.find((person) => person.job === 'Director');
        director = foundDirector?.name ?? null;
      }
    }

    return res.json(mapMedia(data, type, { director }));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération du média' });
  }
}

export async function searchMedia(req, res) {
  try {
    const searchTerm = req.query.searchTerm;

    if (!searchTerm) {
      return res.status(400).json({ message: "Paramètre 'searchTerm' requis" });
    }

    const response = await fetch(
      `${process.env.TMDB_BASE_URL}/search/multi?api_key=${process.env.TMDB_API_KEY}&language=fr-FR&query=${encodeURIComponent(searchTerm)}`
    );

    if (!response.ok) {
      throw new Error('Erreur TMDB searchMedia');
    }

    const data = await response.json();
    const results = data.results
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item) => mapMedia(item, item.media_type));

    return res.json(results);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur lors de la recherche de média' });
  }
}
