// fix-urls.local.js
// But : remplacer les URLs Railway par localhost dans la BDD locale uniquement.
// Analogie : on passe un coup de stylo sur le carnet d'adresses pour 
// rediriger "cines-delices-production.up.railway.app" vers "localhost:3000".

import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const OLD = 'https://cines-delices-production.up.railway.app';
const NEW = 'http://localhost:3000';

async function main() {
  // 1. Garde-fou : on vérifie qu'on est bien sur la BDD locale.
  // Si DATABASE_URL pointe vers Railway, on stoppe immédiatement.
  const dbUrl = process.env.DATABASE_URL || '';
  if (!/@(localhost|127\.0\.0\.1|db):\d+/i.test(dbUrl)) {
    console.error('⛔ DATABASE_URL ne pointe pas vers localhost. Abandon par sécurité.');
    console.error(`   DATABASE_URL : ${dbUrl.replace(/:[^:@]+@/, ':***@')}`);
    process.exit(1);
  }

  // 2. Connexion Prisma 7 avec adaptateur PG (même pattern que ton seed-v4)
  const pool = new pg.Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 3. Correction des posters de films/séries (table Media)
    const mediaList = await prisma.media.findMany({
      where: { posterUrl: { contains: OLD } },
    });
    console.log(`📽️  ${mediaList.length} posters à corriger`);
    for (const m of mediaList) {
      await prisma.media.update({
        where: { id: m.id },
        data: { posterUrl: m.posterUrl.replace(OLD, NEW) },
      });
    }

    // 4. Correction des images de recettes (table Recipe)
    const recipes = await prisma.recipe.findMany({
      where: { imageURL: { contains: OLD } },
    });
    console.log(`🍳 ${recipes.length} images de recettes à corriger`);
    for (const r of recipes) {
      await prisma.recipe.update({
        where: { id: r.id },
        data: { imageURL: r.imageURL.replace(OLD, NEW) },
      });
    }

    console.log('✅ URLs locales restaurées');
  } catch (e) {
    console.error('❌ Erreur :', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();