import * as fs from 'fs';
import * as path from 'path';
import postgres from 'postgres';
import { CONFIG } from '../config';

async function runMigrations() {
  console.log('[Migrations] Connecting via direct URL:', CONFIG.databaseUrlDirect);
  const sql = postgres(CONFIG.databaseUrlDirect, { max: 1 });

  try {
    // Ensure migrations tracking table exists
    await sql`
      CREATE TABLE IF NOT EXISTS _drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const migrationsDir = path.resolve(__dirname, '../../../migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('[Migrations] No migrations directory found.');
      return;
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      const existing = await sql`
        SELECT 1 FROM _drizzle_migrations WHERE hash = ${file};
      `;

      if (existing.length > 0) {
        console.log(`[Migrations] Skipping already applied: ${file}`);
        continue;
      }

      console.log(`[Migrations] Applying: ${file}...`);
      await sql.unsafe(content);
      await sql`
        INSERT INTO _drizzle_migrations (hash) VALUES (${file});
      `;
      console.log(`[Migrations] Successfully applied: ${file}`);
    }

    console.log('[Migrations] All migrations completed cleanly.');
  } catch (err) {
    console.error('[Migrations] Error applying migrations:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
