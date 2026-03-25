import 'dotenv/config';
import { defineConfig } from 'prisma/config';


const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
   ...(isProduction ? { ssl: { rejectUnauthorized: false } } : {}),
  },
  
  migrations: {
    seed: 'node prisma/seed.js',
  },
});