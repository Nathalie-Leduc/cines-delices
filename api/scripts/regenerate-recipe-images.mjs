import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../public/uploads/recipes');

// Assurer que le dossier existe
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Importer prisma dynamiquement
const { prisma } = await import('../src/lib/prisma.js');

async function main() {
  console.log('🎬 Régénération des images de recettes...\n');

  const recipes = await prisma.recipe.findMany({
    select: { id: true, titre: true, imageURL: true }
  });

  let ok = 0, errors = 0;

  for (const recipe of recipes) {
    const url = recipe.imageURL;
    if (!url) continue;

    // Extraire le nom de fichier
    const filename = url.split('/').pop(); // recipe-photo-XXXX.webp
    const outputPath = path.join(UPLOADS_DIR, filename);

    if (fs.existsSync(outputPath)) {
      console.log(`  ⏭️  ${recipe.titre} — déjà présent`);
      ok++;
      continue;
    }

    // Extraire l'ID Unsplash depuis le nom de fichier
    // recipe-photo-1604908176997-125f25cc6f3d.webp → photo-1604908176997-125f25cc6f3d
    const photoId = filename.replace('recipe-', '').replace('.webp', '');
    const unsplashUrl = `https://images.unsplash.com/${photoId}?w=800`;

    try {
      console.log(`  ↓ ${recipe.titre}...`);
      const res = await fetch(unsplashUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const buffer = Buffer.from(await res.arrayBuffer());
      const sharp = (await import('sharp')).default;

      await sharp(buffer)
        .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      console.log(`  ✅ ${recipe.titre}`);
      ok++;
    } catch (e) {
      console.log(`  ❌ ${recipe.titre} — ${e.message}`);
      errors++;
    }
  }

  console.log(`\n✅ ${ok} images OK, ❌ ${errors} erreurs`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
