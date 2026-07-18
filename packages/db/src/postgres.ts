import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from './config.js';

export const dbPool = new Pool({
  connectionString: config.databaseUrl,
  max: config.dbPoolMax,
  idleTimeoutMillis: config.dbIdleTimeoutMs,
  connectionTimeoutMillis: config.dbConnectionTimeoutMs,
  statement_timeout: config.dbStatementTimeoutMs,
});

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const client = await dbPool.connect();
  try {
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
}

export async function queryWithTenant<T extends QueryResultRow = any>(
  tenantId: string,
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const client = await dbPool.connect();
  try {
    await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function transactionWithTenant<T>(
  tenantId: string,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getTenantById(tenantId: string) {
  return query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
}

export async function getDevicesByTenant(tenantId: string) {
  return queryWithTenant(tenantId, 'SELECT * FROM devices ORDER BY name');
}

export async function getDeviceById(tenantId: string, deviceId: string) {
  return queryWithTenant(tenantId, 'SELECT * FROM devices WHERE id = $1', [deviceId]);
}

export async function createDevice(
  tenantId: string,
  name: string,
  status: string = 'inactive',
  metadata: Record<string, unknown> = {}
) {
  return transactionWithTenant(tenantId, async (client) => {
    const result = await client.query(
      `INSERT INTO devices (tenant_id, name, status, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [tenantId, name, status, JSON.stringify(metadata)]
    );
    return result.rows[0];
  });
}

export async function updateDevice(
  tenantId: string,
  deviceId: string,
  updates: Partial<{ name: string; status: string; metadata: Record<string, unknown> }>
) {
  const setClause: string[] = [];
  const params: unknown[] = [tenantId, deviceId];
  let paramIndex = 3;

  if (updates.name !== undefined) {
    setClause.push(`name = $${paramIndex++}`);
    params.push(updates.name);
  }
  if (updates.status !== undefined) {
    setClause.push(`status = $${paramIndex++}`);
    params.push(updates.status);
  }
  if (updates.metadata !== undefined) {
    setClause.push(`metadata = $${paramIndex++}, updated_at = CURRENT_TIMESTAMP`);
    params.push(JSON.stringify(updates.metadata));
  }

  if (setClause.length === 0) {
    throw new Error('No updates provided');
  }

  return transactionWithTenant(tenantId, async (client) => {
    const result = await client.query(
      `UPDATE devices SET ${setClause.join(', ')} WHERE tenant_id = $1 AND id = $2 RETURNING *`,
      params
    );
    return result.rows[0];
  });
}

export async function deleteDevice(tenantId: string, deviceId: string) {
  return transactionWithTenant(tenantId, async (client) => {
    const result = await client.query(
      'DELETE FROM devices WHERE tenant_id = $1 AND id = $2 RETURNING id',
      [tenantId, deviceId]
    );
    return result.rows[0];
  });
}

export async function saveDashboardConfig(
  tenantId: string,
  userId: string,
  config: string
) {
  return transactionWithTenant(tenantId, async (client) => {
    const result = await client.query(
      `INSERT INTO dashboard_configs (tenant_id, user_id, config, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (tenant_id, user_id) DO UPDATE SET
         config = EXCLUDED.config,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [tenantId, userId, config]
    );
    return result.rows[0];
  });
}

export async function getDashboardConfig(tenantId: string, userId: string) {
  return queryWithTenant(
    tenantId,
    'SELECT config FROM dashboard_configs WHERE user_id = $1',
    [userId]
  );
}

export async function closePool(): Promise<void> {
  await dbPool.end();
}

dbPool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});