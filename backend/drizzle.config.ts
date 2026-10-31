import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
dotenv.config();

export default defineConfig({
  schema: './src/modules/*/infrastructure/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_DIRECT || 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
  },
  verbose: true,
  strict: true,
});
