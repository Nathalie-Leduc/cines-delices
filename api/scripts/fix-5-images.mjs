import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../public/uploads/recipes');
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const fixes = [
  { slug: 'soupe-exotique', url: 'https://images.unsplash.com/photo-1605909388460-74ec8b204127?w=800' },
  { slug: 'kir-champetre-de-ratatouille', url: 'https://images.unsplash.com/photo-1567759131595-5e952a1b9a4e?w=800' },
  { slug: 'moules-marinieres-du-joker', url: 'https://plus.unsplash.com/premium_photo-1707695882668-5dc6f92e6f70?w=800' },
  { slug: 'choux-a-la-creme-de-poudlard', url: 'https://images.unsplash.com/photo-1643311927292-46c6478ad4e8?w=800' },
  { slug: 'bruschetta-facon-ratatouille', url: 'https://images.unsplash.com/photo-1594978583693-8dfdfc93f052?w=800' },
];

async function main() {
  for (const fix of fixes) {
    try {
      const res = await fetch(fix.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const sharp = (await import('sharp')).default;
      const filename = `recipe-fix-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const outputPath = path.join(UPLOADS_DIR, filename);
      await sharp(buffer).resize({ width: 800, fit: 'inside' }).webp({ quality: 80 }).toFile(outputPath);
      const imageURL = `${API_BASE_URL}/uploads/recipes/${filename}`;
      await prisma.recipe.update({ where: { slug: fix.slug }, data: { imageURL } });
      console.log(`✅ ${fix.slug}`);
    } catch (e) {
      console.log(`❌ ${fix.slug} — ${e.message}`);
    }
  }
  await prisma.$disconnect();
}
main();
