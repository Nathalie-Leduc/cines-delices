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
//   const localPath = await downloadAndConvertPoster(
//     'https://image.tmdb.org/t/p/w500/posterpath.jpg',
//   );
//   // → "/uploads/posters/poster-posterpath.webp" (chemin relatif)
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
 * @returns {Promise<string|null>} - Chemin public RELATIF du poster WebP
 *                                   (ex: "/uploads/posters/poster-abc.webp"),
 *                                   ou null si échec. Le client préfixe avec
 *                                   l'origine API au moment du rendu.
 */
export async function downloadAndConvertPoster(tmdbImageUrl) {
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

    // Si le poster est déjà converti, on renvoie directement le chemin
    // (évite de re-télécharger à chaque fois)
    if (fs.existsSync(outputPath)) {
      return buildPosterUrl(filename);
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

    return buildPosterUrl(filename);
  } catch (error) {
    console.error(`[POSTER] ❌ Erreur conversion poster :`, error.message);
    return null; // En cas d'erreur, on garde l'URL TMDB originale
  }
}

/**
 * Construit le chemin public (relatif) d'un poster local.
 *
 * On stocke volontairement un chemin RELATIF en BDD (ex: "/uploads/posters/xxx.webp"),
 * pas une URL absolue. Raisons :
 *   1. Portabilité : la même donnée fonctionne en dev (localhost), en preview Railway
 *      et en prod, sans dépendre d'une variable d'env API_BASE_URL.
 *   2. Migration sereine : changer de domaine ne casse pas les URLs en base.
 *   3. Cohérence avec le code client (buildApiAssetUrl) qui sait préfixer un chemin
 *      relatif avec l'origine de l'API au moment du rendu.
 *
 * Analogie : on écrit "le sel est dans le placard de la cuisine", pas "le sel est
 * dans le placard de la cuisine du 24 rue Pasteur à Saint-Cyr-sur-Mer". Si on
 * déménage, l'instruction reste valide.
 */
function buildPosterUrl(filename) {
  return `/uploads/${POSTERS_SUBDIR}/${filename}`;
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
