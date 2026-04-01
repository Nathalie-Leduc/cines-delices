import fs from 'node:fs';
import path from 'node:path';

// ============================================================
// SERVICE TMDB POSTER — Télécharge et convertit en WebP
// ============================================================
//
//
// Avantages :
//   1. Plus de dépendance à TMDB pour l'affichage (résilience)
//   2. Pas de requêtes tierces → plus de problème RGPD/cookies
//   3. Images optimisées en WebP (plus légères)
//   4. Chargement plus rapide (servies depuis votre serveur)
//
// Usage dans resolveAdminMediaId ou le seed :
//   const localUrl = await downloadAndConvertPoster(
//     'https://image.tmdb.org/t/p/w500/posterpath.jpg',
//     req  // optionnel, pour construire l'URL publique
//   );
// ============================================================

const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
const POSTERS_SUBDIR = 'posters';
const POSTERS_DIR = path.join(UPLOADS_DIR, POSTERS_SUBDIR);

const SHARP_CONFIG = {
  webpQuality: 80,
  maxWidth: 500,   // les posters n'ont pas besoin d'être énormes
  maxHeight: 750,
};

let sharpLoaderPromise = null;

async function getSharp() {
  if (!sharpLoaderPromise) {
    sharpLoaderPromise = import('sharp')
      .then((module) => module.default || module)
      .catch((error) => {
        console.warn('[POSTER] Sharp indisponible, conversion désactivée :', error.message);
        return null;
      });
  }

  return sharpLoaderPromise;
}

// Créer le dossier posters s'il n'existe pas
fs.mkdirSync(POSTERS_DIR, { recursive: true });

/**
 * Télécharge une image depuis une URL et la convertit en WebP.
 *
 * 🎬 Le directeur artistique va chercher l'affiche chez le fournisseur,
 * la retouche, et la range dans les archives du cinéma.
 *
 * @param {string} tmdbImageUrl   - URL complète de l'image TMDB
 *                                  (ex: "https://image.tmdb.org/t/p/w500/abc.jpg")
 * @param {Object} [req]          - Objet request Express (pour construire l'URL publique)
 * @returns {Promise<string|null>} - URL publique locale du poster WebP, ou null si échec
 */
export async function downloadAndConvertPoster(tmdbImageUrl, req) {
  if (!tmdbImageUrl) {
    return null;
  }

  try {
    const sharp = await getSharp();
    if (!sharp) {
      return null;
    }

    // Extraire un nom unique depuis l'URL TMDB
    // "/abc123def.jpg" → "abc123def"
    const urlPath = new URL(tmdbImageUrl).pathname;
    const originalName = path.basename(urlPath, path.extname(urlPath));
    const filename = `poster-${originalName}.webp`;
    const outputPath = path.join(POSTERS_DIR, filename);

    // Si le poster est déjà converti, on renvoie directement l'URL
    // (évite de re-télécharger à chaque fois)
    if (fs.existsSync(outputPath)) {
      return buildPosterUrl(req, filename);
    }

    // Télécharger l'image depuis TMDB
    const response = await fetch(tmdbImageUrl);
    if (!response.ok) {
      console.warn(`[POSTER] Impossible de télécharger : ${tmdbImageUrl} (HTTP ${response.status})`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Convertir en WebP avec Sharp
    await sharp(buffer)
      .resize({
        width: SHARP_CONFIG.maxWidth,
        height: SHARP_CONFIG.maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: SHARP_CONFIG.webpQuality,
      })
      .toFile(outputPath);

    const originalSize = buffer.length;
    const newSize = fs.statSync(outputPath).size;
    const savings = Math.round((1 - newSize / originalSize) * 100);

    console.log(
      `[POSTER] ✅ ${filename} (${(originalSize / 1024).toFixed(0)} KB → ${(newSize / 1024).toFixed(0)} KB, -${savings}%)`
    );

    return buildPosterUrl(req, filename);
  } catch (error) {
    console.error(`[POSTER] ❌ Erreur conversion poster :`, error.message);
    return null; // En cas d'erreur, on garde l'URL TMDB originale
  }
}

/**
 * Construit l'URL publique d'un poster local.
 */
function buildPosterUrl(req, filename) {
  if (req) {
    const baseUrl = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
    return `${baseUrl}/uploads/${POSTERS_SUBDIR}/${filename}`;
  }

  // Fallback sans req (scripts, seed, cron)
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/uploads/${POSTERS_SUBDIR}/${filename}`;
}

/**
 * Convertit un poster TMDB pour un média existant en BDD.
 * Utile pour la migration des posters existants.
 *
 * @param {Object} prisma   - Instance Prisma
 * @param {string} mediaId  - UUID du média en BDD
 * @returns {Promise<string|null>} - Nouvelle URL locale ou null
 */
export async function migratePosterForMedia(prisma, mediaId) {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { id: true, posterUrl: true, titre: true },
  });

  if (!media?.posterUrl) {
    return null;
  }

  // Déjà local ? On skip
  if (!media.posterUrl.includes('image.tmdb.org')) {
    return media.posterUrl;
  }

  const localUrl = await downloadAndConvertPoster(media.posterUrl);
  if (!localUrl) {
    return media.posterUrl; // garder l'URL TMDB en fallback
  }

  // Mettre à jour en BDD
  await prisma.media.update({
    where: { id: media.id },
    data: { posterUrl: localUrl },
  });

  console.log(`[POSTER] 🔄 ${media.titre} : TMDB → local WebP`);
  return localUrl;
}
