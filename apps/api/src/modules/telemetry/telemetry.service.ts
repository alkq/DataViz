import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { getClickHouseClient, insertTelemetry, queryTelemetry, queryAggregatedTelemetry, getDeviceMetadata } from '@platform/db';
import { MetricQuerySchema, MetricQuery } from '@platform/shared';

@Injectable()
export class TelemetryService {
  constructor(@Inject('PG_POOL') private pgPool: Pool) {}

  async ingestTelemetry(telemetry: Array<{
    timestamp: string;
    tenant_id: string;
    device_id: string;
    metric_name: string;
    metric_value: number;
  }>): Promise<void> {
    await insertTelemetry(telemetry);
  }

  async queryTelemetry(
    tenantId: string,
    query: MetricQuery
  ): Promise<unknown[]> {
    const validated = MetricQuerySchema.parse({
      ...query,
      deviceId: query.deviceId,
    });

    const resolutionMap: Record<string, 'raw' | 'hourly' | 'daily'> = {
      '1s': 'raw',
      '1m': 'raw',
      '5m': 'raw',
      '1h': 'hourly',
      '1d': 'daily',
    };

    return queryTelemetry(
      tenantId,
      validated.deviceId,
      validated.metricName,
      validated.startDate,
      validated.endDate,
      resolutionMap[validated.resolution] || 'raw'
    );
  }

  async queryAggregated(
    tenantId: string,
    deviceId: string,
    metricName: string,
    startDate: string,
    endDate: string
  ): Promise<unknown[]> {
    return queryAggregatedTelemetry(tenantId, deviceId, metricName, startDate, endDate);
  }

  async getDevicesMetadata(tenantId: string): Promise<unknown[]> {
    return getDeviceMetadata(tenantId);
  }
}

function queryAggreg(tenantId: string, deviceId: string, metricName: string, startDate: string, endDate: string): Promise<unknown[]> {
  return queryAggregatedTelemetry(tenantId, deviceId, metricName, startDate, endDate);
}