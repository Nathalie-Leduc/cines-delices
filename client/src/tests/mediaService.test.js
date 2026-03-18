import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchMedia } from '../services/mediaService';

const mockMovies = [
  { id: 1, title: 'Ratatouille', media_type: 'movie' },
  { id: 2, title: 'Inception', media_type: 'movie' },
];

const mockTvShows = [
  { id: 3, name: 'Friends', media_type: 'tv' },
];

// Helper pour créer un mock fetch propre
const mockFetch = (data) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ results: data }), // simule la vraie structure du back
  }));
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('fetchMedia', () => {
  it('devrait récupérer des films par défaut', async () => {
    mockFetch(mockMovies);

    const movies = await fetchMedia('movie');
    expect(Array.isArray(movies)).toBe(true);
    expect(movies.length).toBeGreaterThan(0);
  });

  it('devrait rechercher un film spécifique', async () => {
    mockFetch(mockMovies);

    const results = await fetchMedia('movie', 'Ratatouille');
    expect(results.some(film => film.title === 'Ratatouille')).toBe(true);
  });

  it('devrait récupérer une série par nom', async () => {
    mockFetch(mockTvShows);

    const results = await fetchMedia('tv', 'Friends');
    expect(results.some(tv => tv.name?.includes('Friends'))).toBe(true);
  });

  it('devrait retourner un tableau vide pour un titre inexistant', async () => {
    mockFetch([]);

    const results = await fetchMedia('movie', 'xyzinexistant');
    expect(results.length).toBe(0);
  });

  it('devrait retourner un tableau vide si le back répond en erreur', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
    }));

    const results = await fetchMedia('movie');
    expect(results).toEqual([]);
  });
});