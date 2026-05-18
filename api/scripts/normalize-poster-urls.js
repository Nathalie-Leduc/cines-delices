// normalize-poster-urls.js
//
// 🎯 BUT : convertir les URLs absolues stockées dans Media.posterUrl
//          en chemins relatifs (ex: "/uploads/posters/x.webp").
//
// 📖 CONTEXTE : avant le fix #poster-url-relative, posterService.js stockait des
//    URLs absolues (parfois "http://localhost:3000/uploads/..." en prod si la var
//    d'env API_BASE_URL n'était pas définie). C'était fragile et non portable.
//
// 🧠 ANALOGIE : on passe en revue le carnet d'adresses du cinéma et on supprime
//    tous les préfixes "ville/rue" pour ne garder que les numéros de salle.
//    Ensuite, le projectionniste (le client) ajoute le nom du cinéma au moment
//    de la projection — chaque cinéma (dev, Railway, ...) ajoutera le sien.
//
// 🚀 USAGE :
//    En local sur la BDD locale :
//      node api/scripts/normalize-poster-urls.js
//
//    En prod sur Railway (à exécuter UNE FOIS après le déploiement) :
//      railway run --service api node api/scripts/normalize-poster-urls.js
//
//    Mode "dry-run" (simulation, n'écrit rien) :
//      node api/scripts/normalize-poster-urls.js --dry-run

import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Convertit une URL en chemin relatif si elle pointe vers /uploads/.
 *
 * Cas gérés :
 *   - "http://localhost:3000/uploads/posters/x.webp"      → "/uploads/posters/x.webp"
 *   - "https://api.railway.app/uploads/posters/x.webp"    → "/uploads/posters/x.webp"
 *   - "/uploads/posters/x.webp"                           → "/uploads/posters/x.webp" (inchangé)
 *   - "https://image.tmdb.org/t/p/w500/x.jpg"             → "https://image.tmdb.org/..." (inchangé, c'est du tiers)
 *   - null / ""                                           → null (inchangé)
 */
function normalizePosterUrl(value) {
  if (!value || typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  // Déjà un chemin relatif → rien à faire
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // URL absolue → on extrait le pathname si elle pointe vers /uploads/
  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith('/uploads/')) {
      return parsed.pathname;
    }
    // URL absolue mais pas vers /uploads/ (ex: TMDB) → on garde tel quel
    return trimmed;
  } catch {
    // Pas une URL valide, on garde tel quel
    return trimmed;
  }
}

async function main() {
  console.log(`🚀 Démarrage de la normalisation des posterUrl${DRY_RUN ? ' (DRY RUN)' : ''}`);

  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl) {
    console.error('⛔ DATABASE_URL manquante.');
    process.exit(1);
  }

  // Connexion Prisma 7 avec adaptateur PG (même pattern que les autres scripts)
  const pool = new pg.Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Récupérer tous les médias avec un posterUrl non null
    const medias = await prisma.media.findMany({
      where: { posterUrl: { not: null } },
      select: { id: true, titre: true, posterUrl: true },
    });

    console.log(`📋 ${medias.length} média(s) trouvé(s) avec un posterUrl`);

    let updatedCount = 0;
    let unchangedCount = 0;

    for (const media of medias) {
      const normalized = normalizePosterUrl(media.posterUrl);

      if (normalized === media.posterUrl) {
        unchangedCount += 1;
        continue;
      }

      console.log(`  ↻ ${media.titre}`);
      console.log(`    avant : ${media.posterUrl}`);
      console.log(`    après : ${normalized}`);

      if (!DRY_RUN) {
        await prisma.media.update({
          where: { id: media.id },
          data: { posterUrl: normalized },
        });
      }
      updatedCount += 1;
    }

    console.log('');
    console.log(`✅ Résumé :`);
    console.log(`   - ${updatedCount} URL(s) normalisée(s)${DRY_RUN ? ' (simulation)' : ''}`);
    console.log(`   - ${unchangedCount} URL(s) inchangée(s) (déjà relatives ou tiers)`);
  } catch (error) {
    console.error('❌ Erreur :', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
