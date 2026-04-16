import { downloadAndConvertPoster } from './posterService.js';
import { prisma } from './prisma.js';
import fs from 'node:fs';
import path from 'node:path';

const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
const POSTERS_DIR = path.join(UPLOADS_DIR, 'posters');

function posterExistsLocally(posterUrl) {
  if (!posterUrl) return true;
  const match = posterUrl.match(/\/uploads\/posters\/([^?#]+)$/);
  if (!match) return true;
  const filename = match[1];
  return fs.existsSync(path.join(POSTERS_DIR, filename));
}

async function getTmdbPosterUrl(media) {
  if (media.posterUrl?.includes('image.tmdb.org')) return media.posterUrl;
  const tmdbApiKey = process.env.TMDB_API_KEY;
  const tmdbBaseUrl = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
  if (!tmdbApiKey) return null;
  try {
    const endpoint = media.type === 'MOVIE'
      ? `${tmdbBaseUrl}/movie/${media.tmdbId}`
      : `${tmdbBaseUrl}/tv/${media.tmdbId}`;
    const response = await fetch(`${endpoint}?api_key=${tmdbApiKey}`);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.poster_path) return null;
    return `https://image.tmdb.org/t/p/w500${data.poster_path}`;
  } catch { return null; }
}

export async function ensurePostersExist() {
  if (process.env.NODE_ENV === 'test') return;
  fs.mkdirSync(POSTERS_DIR, { recursive: true });
  try {
    const medias = await prisma.media.findMany({
      select: { id: true, titre: true, tmdbId: true, type: true, posterUrl: true }
    });
    const missing = medias.filter(m => !posterExistsLocally(m.posterUrl));
    if (missing.length === 0) {
      console.log('[STARTUP] ✅ Tous les posters sont présents');
      return;
    }
    console.log(`[STARTUP] 🔄 ${missing.length} poster(s) manquant(s) — re-téléchargement...`);
    for (const media of missing) {
      try {
        const tmdbUrl = await getTmdbPosterUrl(media);
        if (!tmdbUrl) { console.warn(`[STARTUP] ⚠️  Pas d'URL TMDB pour : ${media.titre}`); continue; }
        const newUrl = await downloadAndConvertPoster(tmdbUrl);
        if (!newUrl) { console.warn(`[STARTUP] ⚠️  Échec : ${media.titre}`); continue; }
        await prisma.media.update({ where: { id: media.id }, data: { posterUrl: newUrl } });
        console.log(`[STARTUP] ✅ ${media.titre} → WebP ok`);
      } catch (error) {
        console.error(`[STARTUP] ❌ ${media.titre} :`, error.message);
      }
    }
    console.log('[STARTUP] 🎬 Posters re-téléchargés');
  } catch (error) {
    console.error('[STARTUP] ❌ Erreur :', error.message);
  }
}
