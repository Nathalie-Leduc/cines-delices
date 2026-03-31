import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { downloadAndConvertPoster } from '../src/lib/posterService.js';

// ============================================================
// SCRIPT DE CORRECTION — Médias incomplets
// ============================================================
// 🎬 Ce script parcourt tous les médias en BDD et complète
// les infos manquantes (synopsis, réalisateur, poster local)
// en interrogeant l'API TMDB.
//
// Usage : node scripts/fix-media-details.mjs
// ============================================================

const connectionString = process.env.DATABASE_URL;
const isLocalDatabase = /@(localhost|127\.0\.0\.1|db):\d+/i.test(connectionString || '');

const pool = new pg.Pool({
  connectionString,
  ...(isLocalDatabase ? {} : { ssl: { rejectUnauthorized: false } }),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🎬 Correction des médias incomplets...\n');

  // Trouver les médias sans synopsis OU sans réalisateur OU sans poster local
  const medias = await prisma.media.findMany({
    where: {
      OR: [
        { synopsis: null },
        { synopsis: '' },
        { realisateur: null },
        { posterUrl: null },
        { posterUrl: { contains: 'image.tmdb.org' } },
      ],
    },
    select: {
      id: true,
      tmdbId: true,
      type: true,
      titre: true,
      synopsis: true,
      realisateur: true,
      posterUrl: true,
    },
  });

  if (medias.length === 0) {
    console.log('✅ Tous les médias sont complets — rien à corriger !');
    process.exit(0);
  }

  console.log(`📸 ${medias.length} média(s) à compléter...\n`);

  let fixed = 0;
  let errors = 0;

  for (const media of medias) {
    try {
      const tmdbType = media.type === 'SERIES' ? 'tv' : 'movie';
      const tmdbUrl = `${process.env.TMDB_BASE_URL}/${tmdbType}/${media.tmdbId}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR&append_to_response=credits`;

      const response = await fetch(tmdbUrl);
      if (!response.ok) {
        console.log(`  ⚠️  ${media.titre} — TMDB HTTP ${response.status}`);
        errors++;
        continue;
      }

      const tmdbData = await response.json();
      const updateData = {};

      // Synopsis
      if (!media.synopsis && tmdbData.overview) {
        updateData.synopsis = tmdbData.overview;
      }

      // Réalisateur
      if (!media.realisateur) {
        const people = media.type === 'MOVIE'
          ? (tmdbData.credits?.crew || [])
              .filter((p) => p.job === 'Director')
              .map((p) => p.name)
          : (tmdbData.created_by || [])
              .map((p) => p.name)
              .filter(Boolean);

        if (people.length > 0) {
          updateData.realisateur = people.join(', ');
        }
      }

      // Année
      const releaseYear = parseInt(
        String(tmdbData.release_date || tmdbData.first_air_date || '').slice(0, 4),
        10,
      );
      if (!media.annee && Number.isInteger(releaseYear)) {
        updateData.annee = releaseYear;
      }

      // Poster local (si absent ou encore en URL TMDB)
      if (!media.posterUrl || media.posterUrl.includes('image.tmdb.org')) {
        if (tmdbData.poster_path) {
          const localUrl = await downloadAndConvertPoster(
            `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`,
          );
          if (localUrl) {
            updateData.posterUrl = localUrl;
          }
        }
      }

      if (Object.keys(updateData).length === 0) {
        console.log(`  ⏭️  ${media.titre} — déjà complet`);
        continue;
      }

      await prisma.media.update({
        where: { id: media.id },
        data: updateData,
      });

      const corrections = Object.keys(updateData).join(', ');
      console.log(`  ✅ ${media.titre} — corrigé : ${corrections}`);
      fixed++;
    } catch (error) {
      console.log(`  ❌ ${media.titre} — ${error.message}`);
      errors++;
    }
  }

  console.log(`\n🎬 Terminé : ${fixed} corrigé(s), ${errors} erreur(s)`);
  await prisma.$disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Erreur fatale :', error);
  process.exit(1);
});
