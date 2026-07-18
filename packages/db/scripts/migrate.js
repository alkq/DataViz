#!/usr/bin/env node
/**
 * Apply PostgreSQL migrations in dependency order, idempotently.
 *
 * This replaces the missing `npm run db:migrate` script. It tracks which
 * migration files have already been applied in a `schema_migrations` table
 * and skips them, so the command is safe to run repeatedly.
 *
 * Usage:  node scripts/migrate.js
 */
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Pool } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://dataviz:dataviz_secure_password@localhost:5432/dataviz';

async function main() {
  const pool = new Pool({ connectionString });

  // Ensure the tracking table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql'))
    .sort(); // 001_*, 002_*, ...

  if (files.length === 0) {
    console.log('No migration files found.');
    await pool.end();
    return;
  }

  const { rows } = await pool.query('SELECT filename FROM schema_migrations');
  let applied = new Set(rows.map((r) => r.filename));

  // Reconcile: if the tracking table is empty but the schema already looks
  // initialized (e.g. Postgres auto-applied migrations via
  // docker-entrypoint-initdb.d), backfill the tracking table so we don't
  // try to re-create existing objects.
  if (applied.size === 0) {
    const { rows: t } = await pool.query(`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'tenants'
    `);
    if (t.length > 0) {
      console.log('Schema already initialized — marking migrations as applied.');
      for (const f of files) {
        await pool.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
          [f]
        );
      }
      applied = new Set(files);
    }
  }

  const pending = files.filter((f) => !applied.has(f));
  if (pending.length === 0) {
    console.log('All migrations already applied ✅ (nothing to do)');
    await pool.end();
    return;
  }

  console.log(`Applying ${pending.length} migration(s)...`);
  for (const file of pending) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`  -> ${file}`);
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [
        file,
      ]);
      await pool.query('COMMIT');
    } catch (err) {
      await pool.query('ROLLBACK');
      throw new Error(`migration ${file} failed: ${err.message}`);
    }
  }

  console.log('Migrations applied successfully ✅');
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
