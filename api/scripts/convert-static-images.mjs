// ============================================================
// 🎬 LE PHOTOGRAPHE DU DÉCOR
// Convertit toutes les images statiques (jpg/png) de public/img
// en WebP — format plus léger et moderne.
//
// Analogie : c'est comme numériser d'anciennes photos argentiques
// pour les stocker sous format numérique optimisé.
// On fait ça UNE SEULE FOIS (one-shot).
//
// Usage : node scripts/convert-static-images.mjs
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// 📁 Dossier cible — adapte ce chemin si besoin
const IMG_DIR = path.resolve(process.cwd(), '..', 'client', 'public', 'img');

// Extensions à convertir (les WebP sont ignorés automatiquement)
const CONVERTIBLE = new Set(['.jpg', '.jpeg', '.png']);

// ⚙️ Config Sharp
const CONFIG = {
  quality: 80,      // 80% = excellent rapport qualité/poids
  maxWidth: 1200,   // inutile d'aller au-delà pour du web
  maxHeight: 1200,
  deleteOriginals: false, // ← passer à false pour garder les .jpg/.png
};

// ─────────────────────────────────────────────────────────
// Convertit un fichier image en WebP
// ─────────────────────────────────────────────────────────
async function convertFile(filePath) {
  const ext      = path.extname(filePath).toLowerCase();
  const baseName = path.basename(filePath, ext);
  const dir      = path.dirname(filePath);
  const outPath  = path.join(dir, `${baseName}.webp`);

  // ⏭️ Déjà converti ? On passe.
  if (fs.existsSync(outPath)) {
    return { file: path.basename(filePath), status: 'skipped' };
  }

  try {
    const originalSize = fs.statSync(filePath).size;

    // 🔧 Sharp : redimensionne si trop grande + convertit en WebP
    await sharp(filePath)
      .resize({
        width: CONFIG.maxWidth,
        height: CONFIG.maxHeight,
        fit: 'inside',            // garde les proportions
        withoutEnlargement: true, // ne grossit pas les petites images
      })
      .webp({ quality: CONFIG.quality })
      .toFile(outPath);

    const newSize = fs.statSync(outPath).size;
    // Calcul des économies en % (comme un coupon de réduction !)
    const savings = Math.round((1 - newSize / originalSize) * 100);

    // 🗑️ Supprime l'original si configuré
    if (CONFIG.deleteOriginals) {
      fs.unlinkSync(filePath);
    }

    return {
      file: path.basename(filePath),
      status: 'converted',
      before: `${(originalSize / 1024).toFixed(1)} KB`,
      after:  `${(newSize / 1024).toFixed(1)} KB`,
      gain:   `-${savings}%`,
    };
  } catch (err) {
    return { file: path.basename(filePath), status: 'error', reason: err.message };
  }
}

// ─────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────
async function main() {
  console.log('🎬 Conversion des images statiques en WebP...\n');

  if (!fs.existsSync(IMG_DIR)) {
    console.error(`❌ Dossier introuvable : ${IMG_DIR}`);
    process.exit(1);
  }

  // 📂 Récupère tous les fichiers convertibles du dossier
  const files = fs.readdirSync(IMG_DIR)
    .filter(f => CONVERTIBLE.has(path.extname(f).toLowerCase()))
    .map(f => path.join(IMG_DIR, f));

  if (files.length === 0) {
    console.log('✅ Aucune image à convertir — tout est déjà en WebP !');
    return;
  }

  console.log(`📸 ${files.length} image(s) trouvée(s)...\n`);

  // Traitement séquentiel (pour ne pas surcharger la mémoire)
  const results = [];
  for (const file of files) {
    const result = await convertFile(file);
    results.push(result);

    // Affichage en temps réel
    if (result.status === 'converted') {
      console.log(`  ✅ ${result.file} : ${result.before} → ${result.after} (${result.gain})`);
    } else if (result.status === 'skipped') {
      console.log(`  ⏭️  ${result.file} : déjà en WebP`);
    } else {
      console.log(`  ❌ ${result.file} : ERREUR — ${result.reason}`);
    }
  }

  // 📊 Résumé final
  const converted = results.filter(r => r.status === 'converted').length;
  const errors    = results.filter(r => r.status === 'error').length;
  console.log(`\n🎉 Terminé ! ${converted} converti(s), ${errors} erreur(s).`);
}

main().catch(err => {
  console.error('Erreur fatale :', err);
  process.exit(1);
});