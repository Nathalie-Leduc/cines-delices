// prisma/fix-db.js
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await pool.query(`
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "realisateur" TEXT
`);

console.log('✅ Colonne realisateur vérifiée/ajoutée');
await pool.end();