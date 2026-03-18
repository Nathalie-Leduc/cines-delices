import pg from 'pg';
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

//pg.Pool gère automatiquement les connexions ouvertes/fermées
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL})
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']  // logs SQL visibles en dev
    : ['warn', 'error'],
});