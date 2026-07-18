import { createClient, ClickHouseClient } from '@clickhouse/client';

export const clickhouseConfig = {
  url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER || 'dataviz',
  password: process.env.CLICKHOUSE_PASSWORD || 'dataviz_secure_password',
  database: process.env.CLICKHOUSE_DB || 'industrial_analytics',
  compression: {
    request: true,
    response: true,
  },
  clickhouse_settings: {
    max_execution_time: 30,
    max_rows_to_read: '10000000',
    max_bytes_to_read: '1000000000', // Cast to string
    max_result_rows: '100000',
    max_result_bytes: '100000000',  // Cast to string
  },
};

let client: ClickHouseClient | null = null;

export function getClickHouseClient(): ClickHouseClient {
  if (!client) {
    client = createClient(clickhouseConfig);
  }
  return client;
}

export interface TelemetryInsert {
  timestamp: string;
  tenant_id: string;
  device_id: string;
  metric_name: string;
  metric_value: number;
}

// ClickHouse DateTime64(3) cannot parse ISO strings with a trailing 'Z'
// (UTC designator). Convert any ISO/date string to the native
// 'YYYY-MM-DD HH:MM:SS.mmm' format it expects.
function toClickHouseDateTime(input: string): string {
  const d = new Date(input);
  if (isNaN(d.getTime())) return input;
  const pad = (n: number, l = 2) => String(n).padStart(l, '0');
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.` +
    `${pad(d.getUTCMilliseconds(), 3)}`
  );
}

export async function insertTelemetry(
  telemetry: TelemetryInsert[]
): Promise<void> {
  const ch = getClickHouseClient();

  const values = telemetry.map((t) => ({
    ...t,
    timestamp: toClickHouseDateTime(t.timestamp),
  }));

  await ch.insert({
    table: 'device_telemetry',
    values,
    format: 'JSONEachRow',
  });
}

export async function queryTelemetry(
  tenantId: string,
  deviceId: string,
  metricName: string,
  startDate: string,
  endDate: string,
  resolution: 'raw' | 'hourly' | 'daily' = 'raw'
): Promise<unknown[]> {
  const ch = getClickHouseClient();
  
  let table = 'device_telemetry';
  let timeColumn = 'timestamp';
  let selectClause = 'timestamp, metric_value';
  let groupByClause = '';
  
  if (resolution === 'hourly') {
    table = 'device_telemetry_hourly';
    timeColumn = 'timestamp';
    selectClause = 'timestamp, avg_value as metric_value, max_value, min_value, count_records';
  } else if (resolution === 'daily') {
    table = 'device_telemetry_daily';
    timeColumn = 'timestamp';
    selectClause = 'timestamp, avg_value as metric_value, max_value, min_value, count_records';
  }
  
  const query = `
    SELECT ${selectClause}
    FROM ${table}
    WHERE tenant_id = {tenantId:UUID}
      AND device_id = {deviceId:UUID}
      AND metric_name = {metricName:String}
      AND ${timeColumn} >= {startDate:DateTime64(3)}
      AND ${timeColumn} <= {endDate:DateTime64(3)}
    ORDER BY ${timeColumn} ASC
    LIMIT 100000
  `;
  
  const result = await ch.query({
    query,
    query_params: {
      tenantId,
      deviceId,
      metricName,
      startDate: toClickHouseDateTime(startDate),
      endDate: toClickHouseDateTime(endDate),
    },
    format: 'JSONEachRow',
  });
  
  return result.json();
}

export async function queryAggregatedTelemetry(
  tenantId: string,
  deviceId: string,
  metricName: string,
  startDate: string,
  endDate: string
): Promise<unknown[]> {
  const ch = getClickHouseClient();
  
  const query = `
    SELECT
      toStartOfHour(timestamp) as hour,
      avg(metric_value) as avg_value,
      max(metric_value) as max_value,
      min(metric_value) as min_value,
      count() as count_records
    FROM device_telemetry
    WHERE tenant_id = {tenantId:UUID}
      AND device_id = {deviceId:UUID}
      AND metric_name = {metricName:String}
      AND timestamp >= {startDate:DateTime64(3)}
      AND timestamp <= {endDate:DateTime64(3)}
    GROUP BY hour
    ORDER BY hour ASC
  `;
  
  const result = await ch.query({
    query,
    query_params: {
      tenantId,
      deviceId,
      metricName,
      startDate,
      endDate,
    },
    format: 'JSONEachRow',
  });
  
  return result.json();
}

export async function getDeviceMetadata(tenantId: string): Promise<unknown[]> {
  const ch = getClickHouseClient();
  
  const query = `
    SELECT device_id, name, status, location, tags, updated_at
    FROM device_metadata
    WHERE tenant_id = {tenantId:UUID}
    ORDER BY name
  `;
  
  const result = await ch.query({
    query,
    query_params: { tenantId },
    format: 'JSONEachRow',
  });
  
  return result.json();
}

export async function closeClickHouseClient(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}