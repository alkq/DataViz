#!/usr/bin/env node
/**
 * Seed demo data into PostgreSQL and ClickHouse.
 *
 * This replaces the missing `npm run db:seed` script. It is idempotent:
 * rows are inserted with ON CONFLICT DO NOTHING / upsert semantics, so it
 * is safe to run repeatedly.
 *
 * Usage:  node scripts/seed.js
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Pool } from 'pg';
import { createClient } from '@clickhouse/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');

const pgConnectionString =
  process.env.DATABASE_URL || 'postgresql://dataviz:dataviz_secure_password@localhost:5432/dataviz';

const chClient = createClient({
  url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER || 'dataviz',
  password: process.env.CLICKHOUSE_PASSWORD || 'dataviz_secure_password',
  database: process.env.CLICKHOUSE_DB || 'industrial_analytics',
});

const DEMO_TENANT = '00000000-0000-0000-0000-000000000001';

async function seedPostgres(pool) {
  console.log('Seeding PostgreSQL...');

  // Demo tenant (already inserted by 001 migration, but keep idempotent)
  await pool.query(
    `INSERT INTO tenants (id, name) VALUES ($1, $2)
     ON CONFLICT (id) DO NOTHING`,
    [DEMO_TENANT, 'Demo Tenant']
  );

  const devices = [
    ['11111111-1111-1111-1111-111111111111', 'Temperature Sensor A1', 'active'],
    ['22222222-1111-1111-1111-111111111112', 'Pressure Transducer B2', 'active'],
    ['33333333-1111-1111-1111-111111111113', 'Flow Meter C3', 'maintenance'],
    ['44444444-1111-1111-1111-111111111114', 'Amperage Monitor D4', 'active'],
  ];
  for (const [id, name, status] of devices) {
    await pool.query(
      `INSERT INTO devices (id, tenant_id, name, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [id, DEMO_TENANT, name, status]
    );
  }

  // A demo local user (password: "demo1234" hashed with bcrypt cost 10)
  // Note: the `users` table has no UNIQUE constraint on `email`, so we
  // upsert on a fixed primary-key UUID instead.
  const demoUserId = '99999999-9999-9999-9999-999999999999';
  const demoHash =
    '$2b$10$CwTSaFjfVXsqZbUf1Zk5eOq9Y4Yw0Yq6c7m9Q0n5X9b0r8W5hQ1uq'; // demo1234
  await pool.query(
    `INSERT INTO users (id, email, password_hash, tenant_id, role)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO NOTHING`,
    [demoUserId, 'admin@demo.com', demoHash, DEMO_TENANT, 'admin']
  );

  console.log('  PostgreSQL seed done ✅');
}

async function seedClickHouse() {
  console.log('Seeding ClickHouse...');

  const metadata = [
    ['11111111-1111-1111-1111-111111111111', 'Temperature Sensor A1', 'active', 'Building A - Floor 1', 'temperature', 'celsius'],
    ['22222222-1111-1111-1111-111111111112', 'Pressure Transducer B2', 'active', 'Building B - Floor 2', 'pressure', 'psi'],
    ['33333333-1111-1111-1111-111111111113', 'Flow Meter C3', 'maintenance', 'Building C - Floor 1', 'flow', 'lpm'],
    ['44444444-1111-1111-1111-111111111114', 'Amperage Monitor D4', 'active', 'Building D - Floor 3', 'amperage', 'amps'],
  ];

  await chClient.insert({
    table: 'device_metadata',
    values: metadata.map(([device_id, name, status, location, type, unit]) => ({
      device_id,
      tenant_id: DEMO_TENANT,
      name,
      status,
      location,
      tags: { type, unit },
      updated_at: new Date().toISOString().slice(0, 23).replace('T', ' '),
    })),
    format: 'JSONEachRow',
  });

  // 24h of synthetic telemetry for every demo device, using each device's
  // own metric (A1=temperature, B2=pressure, C3=flow_rate, D4=amperage).
  const now = Date.now();
  const devices = [
    { id: '11111111-1111-1111-1111-111111111111', metric: 'temperature', base: 22, amp: 5, unit: 'celsius' },
    { id: '22222222-1111-1111-1111-111111111112', metric: 'pressure', base: 45, amp: 8, unit: 'psi' },
    { id: '33333333-1111-1111-1111-111111111113', metric: 'flow_rate', base: 12, amp: 3, unit: 'lpm' },
    { id: '44444444-1111-1111-1111-111111111114', metric: 'amperage', base: 8, amp: 2, unit: 'amps' },
  ];
  const rows = [];
  for (const dev of devices) {
    for (let i = 0; i < 24; i++) {
      const ts = new Date(now - (23 - i) * 3600_000).toISOString().slice(0, 23).replace('T', ' ');
      rows.push({
        timestamp: ts,
        tenant_id: DEMO_TENANT,
        device_id: dev.id,
        metric_name: dev.metric,
        metric_value: +(dev.base + dev.amp * Math.sin(i / 3) + (Math.random() - 0.5) * dev.amp * 0.4).toFixed(2),
      });
    }
  }
  await chClient.insert({
    table: 'device_telemetry',
    values: rows,
    format: 'JSONEachRow',
  });

  console.log(`  ClickHouse seed done ✅ (${rows.length} points across ${devices.length} devices)`);
}

async function main() {
  const pool = new Pool({ connectionString: pgConnectionString });
  try {
    await seedPostgres(pool);
    await seedClickHouse();
    console.log('Seed complete ✅');
  } finally {
    await pool.end();
    await chClient.close();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
