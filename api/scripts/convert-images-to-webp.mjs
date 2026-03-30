import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// ============================================================
// SCRIPT DE MIGRATION — Conversion des images existantes en WebP
// ============================================================
//
// 🎬 Le photographe du plateau reprend toutes les anciennes photos
// du mur du restaurant et les retouche au format WebP.
//
// Usage :
//   node scripts/convert-images-to-webp.mjs
//
// Ce script :
//   1. Parcourt public/uploads/
//   2. Convertit chaque .jpg/.jpeg/.png en .webp
//   3. Supprime l'original (optionnel, configurable)
//   4. Affiche un résumé des conversions
//
// ⚠️ À lancer UNE SEULE FOIS après la mise en place de Sharp.
//    Les nouvelles images sont déjà converties par le middleware.
// ============================================================

const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
const CONVERTIBLE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);
const DELETE_ORIGINALS = true; // Passer à false pour garder les originaux

const SHARP_CONFIG = {
  webpQuality: 80,
  maxWidth: 1200,
  maxHeight: 1200,
};

async function convertFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const baseName = path.basename(filePath, ext);
  const outputPath = path.join(path.dirname(filePath), `${baseName}.webp`);

  // Ne pas reconvertir si le .webp existe déjà
  if (fs.existsSync(outputPath)) {
    return { file: filePath, status: 'skipped', reason: 'WebP existe déjà' };
  }

  try {
    const originalSize = fs.statSync(filePath).size;

    await sharp(filePath)
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

    const newSize = fs.statSync(outputPath).size;
    const savings = Math.round((1 - newSize / originalSize) * 100);

    if (DELETE_ORIGINALS) {
      fs.unlinkSync(filePath);
    }

    return {
      file: path.basename(filePath),
      status: 'converted',
      originalSize: `${(originalSize / 1024).toFixed(1)} KB`,
      newSize: `${(newSize / 1024).toFixed(1)} KB`,
      savings: `${savings}%`,
    };
  } catch (error) {
    return {
      file: path.basename(filePath),
      status: 'error',
      reason: error.message,
    };
  }
}

async function main() {
  console.log('🎬 Le photographe reprend les anciennes photos...\n');

  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log(`❌ Dossier introuvable : ${UPLOADS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(UPLOADS_DIR)
    .filter((file) => CONVERTIBLE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .map((file) => path.join(UPLOADS_DIR, file));

  if (files.length === 0) {
    console.log('✅ Aucune image à convertir — tout est déjà en WebP !');
    process.exit(0);
  }

  console.log(`📸 ${files.length} image(s) à convertir...\n`);

  const results = [];
  for (const file of files) {
    const result = await convertFile(file);
    results.push(result);

    if (result.status === 'converted') {
      console.log(`  ✅ ${result.file} → WebP (${result.originalSize} → ${result.newSize}, -${result.savings})`);
    } else if (result.status === 'skipped') {
      console.log(`  ⏭️  ${result.file} — ${result.reason}`);
    } else {
      console.log(`  ❌ ${result.file} — ${result.reason}`);
    }
  }

  const converted = results.filter((r) => r.status === 'converted').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const errors = results.filter((r) => r.status === 'error').length;

  console.log(`\n🎬 Terminé : ${converted} convertie(s), ${skipped} ignorée(s), ${errors} erreur(s)`);
  if (DELETE_ORIGINALS && converted > 0) {
    console.log('🗑️  Les originaux ont été supprimés.');
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale :', error);
  process.exit(1);
});
