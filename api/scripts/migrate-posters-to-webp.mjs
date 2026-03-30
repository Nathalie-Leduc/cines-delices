import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';
import { downloadAndConvertPoster } from '../src/lib/posterService.js';

// ============================================================
// SCRIPT DE MIGRATION — Posters TMDB → WebP local
// ============================================================
//
// Le directeur artistique fait le tour du cinéma et remplace
// toutes les affiches louées (URLs image.tmdb.org) par des copies
// optimisées en WebP stockées localement.
//
// Usage :
//   node scripts/migrate-posters-to-webp.mjs
//
// Ce script :
//   1. Récupère tous les médias dont posterUrl pointe vers TMDB
//   2. Télécharge chaque poster
//   3. Convertit en WebP avec Sharp
//   4. Met à jour l'URL en BDD
//
// ⚠️ À lancer UNE SEULE FOIS après la mise en place de Sharp.
//    Les nouveaux médias créés via resolveAdminMediaId utiliseront
//    automatiquement downloadAndConvertPoster.
// ============================================================

async function main() {
  console.log('🎬 Le directeur artistique remplace les affiches louées...\n');

  // Trouver tous les médias avec un poster TMDB
  const medias = await prisma.media.findMany({
    where: {
      posterUrl: {
        contains: 'image.tmdb.org',
      },
    },
    select: {
      id: true,
      titre: true,
      posterUrl: true,
    },
  });

  if (medias.length === 0) {
    console.log('✅ Aucune affiche TMDB à convertir — tout est déjà local !');
    process.exit(0);
  }

  console.log(`📸 ${medias.length} affiche(s) à convertir...\n`);

  let converted = 0;
  let errors = 0;

  for (const media of medias) {
    try {
      const localUrl = await downloadAndConvertPoster(media.posterUrl);

      if (localUrl) {
        await prisma.media.update({
          where: { id: media.id },
          data: { posterUrl: localUrl },
        });

        console.log(`  ✅ ${media.titre} → WebP local`);
        converted++;
      } else {
        console.log(`  ⚠️  ${media.titre} — téléchargement échoué, URL TMDB conservée`);
        errors++;
      }
    } catch (error) {
      console.log(`  ❌ ${media.titre} — ${error.message}`);
      errors++;
    }
  }

  console.log(`\n🎬 Terminé : ${converted} convertie(s), ${errors} erreur(s)`);
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Erreur fatale :', error);
  process.exit(1);
});
