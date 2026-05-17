import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../public/uploads/recipes');
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Import dynamique APRÈS dotenv (pour que DATABASE_URL soit chargée)
const { prisma } = await import('../src/lib/prisma.js');

const fixes = [
  { slug: 'soupe-exotique', url: 'https://images.unsplash.com/photo-1605909388460-74ec8b204127?w=800' },
  { slug: 'kir-champetre-de-ratatouille', url: 'https://images.unsplash.com/photo-1567759131595-5e952a1b9a4e?w=800' },
  { slug: 'moules-marinieres-du-joker', url: 'https://plus.unsplash.com/premium_photo-1707695882668-5dc6f92e6f70?w=800' },
  { slug: 'choux-a-la-creme-de-poudlard', url: 'https://images.unsplash.com/photo-1643311927292-46c6478ad4e8?w=800' },
  { slug: 'bruschetta-facon-ratatouille', url: 'https://images.unsplash.com/photo-1594978583693-8dfdfc93f052?w=800' },
  { slug: 'tartines-chevre-miel-du-joker', url: 'https://plus.unsplash.com/premium_photo-1664127534763-cf0e673c9276?w=800' },
  { slug: 'rillettes-de-saumon-du-bear', url: 'https://images.unsplash.com/photo-1596591136135-1569bac242bd?w=800' },
  { slug: 'gougeres-au-fromage-du-hobbit', url: 'https://images.unsplash.com/photo-1737700089286-db0454cecadc?w=800' },
  { slug: 'soupe-a-loignon-de-soul-kitchen', url: 'https://plus.unsplash.com/premium_photo-1727960325953-ef51e51d73f1?w=800' },
  { slug: 'tartare-de-saumon-du-festin-de-babette', url: 'https://images.unsplash.com/photo-1611001395395-a55dc4cb6092?w=800' },
  { slug: 'veloute-de-champignons-de-the-bear', url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800' },
  { slug: 'gaspacho-de-breaking-bad', url: 'https://images.unsplash.com/photo-1778104682662-0cc3a777fad3?w=800' },
];

/**
 * Extrait l'ID Unsplash depuis une URL.
 * Exemples :
 *   https://images.unsplash.com/photo-1605909388460-74ec8b204127?w=800
 *     → photo-1605909388460-74ec8b204127
 *   https://plus.unsplash.com/premium_photo-1707695882668-5dc6f92e6f70?w=800
 *     → premium_photo-1707695882668-5dc6f92e6f70
 * 
 * 🎬 Analogie : on extrait le numéro de négatif depuis l'étiquette
 *    complète de la pellicule.
 */
function extractUnsplashId(url) {
  // 1. On enlève les query params (?w=800)
  const cleanUrl = url.split('?')[0];
  // 2. On prend la dernière partie après le dernier /
  return cleanUrl.split('/').pop();
}

async function main() {
  console.log(`🎬 Fix de ${fixes.length} images de recettes...\n`);

  for (const fix of fixes) {
    try {
      // 1. On reconstitue le nom de fichier selon la convention "régénérable"
      const photoId = extractUnsplashId(fix.url);
      const filename = `recipe-${photoId}.webp`;
      //                ^^^^^^^^ même préfixe que regenerate-recipe-images.mjs

      const outputPath = path.join(UPLOADS_DIR, filename);

      // 2. Téléchargement
      const res = await fetch(fix.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());

      // 3. Conversion Sharp (mêmes paramètres que regenerate-recipe-images.mjs)
      const sharp = (await import('sharp')).default;
      await sharp(buffer)
        .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      // 4. Mise à jour BDD
      const imageURL = `${API_BASE_URL}/uploads/recipes/${filename}`;
      await prisma.recipe.update({
        where: { slug: fix.slug },
        data: { imageURL },
      });

      console.log(`✅ ${fix.slug} → ${filename}`);
    } catch (e) {
      console.log(`❌ ${fix.slug} — ${e.message}`);
    }
  }

  await prisma.$disconnect();
}

main();