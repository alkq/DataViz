import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { getClickHouseClient, insertTelemetry, queryTelemetry, queryAggregatedTelemetry, getDeviceMetadata } from '@platform/db';
import { config } from '@platform/db';

@Injectable()
export class HealthService {
  constructor(@Inject('PG_POOL') private pgPool: Pool) {}

  async checkPostgres(): Promise<{ status: string; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.pgPool.query('SELECT 1');
      return { status: 'healthy', latencyMs: Date.now() - start };
    } catch (error) {
      return { status: 'unhealthy', latencyMs: Date.now() - start };
    }
  }

  async checkClickHouse(): Promise<{ status: string; latencyMs: number }> {
    const start = Date.now();
    try {
      const ch = getClickHouseClient();
      await ch.query({ query: 'SELECT 1', format: 'JSONEachRow' });
      return { status: 'healthy', latencyMs: Date.now() - start };
    } catch (error) {
      return { status: 'unhealthy', latencyMs: Date.now() - start };
    }
  }

  async checkAll(): Promise<{
    status: string;
    timestamp: string;
    services: {
      postgres: { status: string; latencyMs: number };
      clickhouse: { status: string; latencyMs: number };
    };
  }> {
    const [postgres, clickhouse] = await Promise.all([
      this.checkPostgres(),
      this.checkClickHouse(),
    ]);

    const allHealthy = postgres.status === 'healthy' && clickhouse.status === 'healthy';

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: { postgres, clickhouse },
    };
  }
}