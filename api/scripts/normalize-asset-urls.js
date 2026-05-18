// normalize-asset-urls.js
//
// 🎯 BUT : convertir les URLs absolues stockees dans la BDD en chemins relatifs.
//    Concerne deux champs :
//      - Media.posterUrl       (affiches de films/series)
//      - Recipe.imageURL       (images de recettes uploadees)
//
// 📖 CONTEXTE : avant le refactor des assets, posterService.js et
//    recipeImageUploadMiddleware.js stockaient des URLs absolues
//    (ex: "https://api.railway.app/uploads/x.webp", parfois
//    "http://localhost:3000/uploads/x.webp" en fallback). Resultat : ces
//    URLs se cassaient des qu'on changeait de domaine.
//
//    Le nouveau code stocke des chemins RELATIFS ("/uploads/x.webp") et
//    le client (buildApiAssetUrl) ajoute l'origine API au moment du rendu.
//    Ce script migre les anciennes donnees vers ce nouveau format.
//
// 🧠 ANALOGIE : on passe en revue le carnet d'adresses du cinema et on
//    supprime tous les prefixes "ville/rue" pour ne garder que les numeros
//    de salle. Ensuite, le projectionniste (le client) ajoute le nom du
//    cinema au moment de la projection — chaque cinema (dev, Railway, ...)
//    ajoutera le sien.
//
// 🚀 USAGE :
//    Mode dry-run (simulation, n'ecrit rien) :
//      railway run --service cines-delices.api node api/scripts/normalize-asset-urls.js --dry-run
//
//    Application reelle :
//      railway run --service cines-delices.api node api/scripts/normalize-asset-urls.js

import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Convertit une URL en chemin relatif si elle pointe vers /uploads/.
 *
 * Cas geres :
 *   - "http://localhost:3000/uploads/x.webp"               → "/uploads/x.webp"
 *   - "https://api.railway.app/uploads/posters/x.webp"     → "/uploads/posters/x.webp"
 *   - "/uploads/posters/x.webp"                            → "/uploads/posters/x.webp" (inchange)
 *   - "https://image.tmdb.org/t/p/w500/x.jpg"              → inchange (tiers)
 *   - "https://images.unsplash.com/photo-xxx?w=500"        → inchange (tiers)
 *   - null / ""                                            → inchange
 */
function normalizeAssetUrl(value) {
  if (!value || typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  // Deja un chemin relatif → rien a faire
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // URL absolue → on extrait le pathname si elle pointe vers /uploads/
  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith('/uploads/')) {
      return parsed.pathname;
    }
    // URL absolue mais pas vers /uploads/ (ex: TMDB, Unsplash) → inchangee
    return trimmed;
  } catch {
    // Pas une URL valide, on garde tel quel
    return trimmed;
  }
}

/**
 * Boucle generique de normalisation pour une table donnee.
 *
 * Analogie : meme procedure qu'un comptable qui passe en revue le grand-livre,
 * trouve les ecritures a corriger, et applique la correction. La procedure
 * est la meme pour la table Media et la table Recipe — on factorise.
 */
async function normalizeTable({ label, findMany, updateOne, urlField }) {
  console.log(`\n📋 [${label}] Recherche des enregistrements avec ${urlField} non null...`);
  const records = await findMany();
  console.log(`   → ${records.length} enregistrement(s) trouve(s)`);

  let updatedCount = 0;
  let unchangedCount = 0;

  for (const record of records) {
    const original = record[urlField];
    const normalized = normalizeAssetUrl(original);

    if (normalized === original) {
      unchangedCount += 1;
      continue;
    }

    console.log(`   ↻ ${record.label}`);
    console.log(`       avant : ${original}`);
    console.log(`       apres : ${normalized}`);

    if (!DRY_RUN) {
      await updateOne(record.id, normalized);
    }
    updatedCount += 1;
  }

  return { updatedCount, unchangedCount, total: records.length };
}

async function main() {
  console.log(`🚀 Demarrage de la normalisation des URLs d'assets${DRY_RUN ? ' (DRY RUN)' : ''}`);

  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl) {
    console.error('⛔ DATABASE_URL manquante.');
    process.exit(1);
  }

  // Connexion Prisma 7 avec adaptateur PG (meme pattern que les autres scripts)
  const pool = new pg.Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // ─── Table Media : posterUrl ─────────────────────────────────────────────
    const mediaResult = await normalizeTable({
      label: 'Media.posterUrl',
      urlField: 'posterUrl',
      findMany: async () => {
        const items = await prisma.media.findMany({
          where: { posterUrl: { not: null } },
          select: { id: true, titre: true, posterUrl: true },
        });
        // On uniformise pour la boucle : "label" = ce qu'on affiche au log
        return items.map((m) => ({ id: m.id, label: m.titre, posterUrl: m.posterUrl }));
      },
      updateOne: (id, posterUrl) => prisma.media.update({ where: { id }, data: { posterUrl } }),
    });

    // ─── Table Recipe : imageURL ─────────────────────────────────────────────
    const recipeResult = await normalizeTable({
      label: 'Recipe.imageURL',
      urlField: 'imageURL',
      findMany: async () => {
        const items = await prisma.recipe.findMany({
          where: { imageURL: { not: null } },
          select: { id: true, titre: true, imageURL: true },
        });
        return items.map((r) => ({ id: r.id, label: r.titre, imageURL: r.imageURL }));
      },
      updateOne: (id, imageURL) => prisma.recipe.update({ where: { id }, data: { imageURL } }),
    });

    // ─── Resume ──────────────────────────────────────────────────────────────
    console.log('\n✅ Resume :');
    console.log(`   📺 Media   : ${mediaResult.updatedCount} normalise(s), ${mediaResult.unchangedCount} inchange(s) / ${mediaResult.total} au total`);
    console.log(`   🍽️  Recipe  : ${recipeResult.updatedCount} normalise(s), ${recipeResult.unchangedCount} inchange(s) / ${recipeResult.total} au total`);
    if (DRY_RUN) {
      console.log('\n⚠️  Mode DRY RUN actif : aucune modification reelle. Relance sans --dry-run pour appliquer.');
    }
  } catch (error) {
    console.error('❌ Erreur :', error); 
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
