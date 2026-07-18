import { z } from 'zod';
import type { MetricName, DeviceStatus } from '../types/index.js';

export const MetricNameSchema = z.enum(['temperature', 'pressure', 'flow_rate', 'amperage']);
export const DeviceStatusSchema = z.enum(['active', 'inactive', 'maintenance', 'error']);
export const ResolutionSchema = z.enum(['1s', '1m', '5m', '1h', '1d']);

export const UUIDSchema = z.string().uuid({ message: 'Invalid identifier format' });

export const TenantSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  createdAt: z.date(),
});

export const DeviceSchema = z.object({
  id: UUIDSchema,
  tenantId: UUIDSchema,
  name: z.string().min(1).max(255),
  status: DeviceStatusSchema.default('inactive'),
  createdAt: z.date(),
});

export const CreateDeviceSchema = DeviceSchema.omit({ id: true, createdAt: true });
export const UpdateDeviceSchema = CreateDeviceSchema.partial();

export const TelemetryPointSchema = z.object({
  timestamp: z.date(),
  tenantId: UUIDSchema,
  deviceId: UUIDSchema,
  metricName: MetricNameSchema,
  metricValue: z.number().finite(),
});

export const AggregatedTelemetrySchema = z.object({
  timestamp: z.date(),
  tenantId: UUIDSchema,
  deviceId: UUIDSchema,
  metricName: MetricNameSchema,
  avgValue: z.number().finite(),
  maxValue: z.number().finite(),
  minValue: z.number().finite(),
  countRecords: z.number().int().positive(),
});

export const MetricQuerySchema = z
  .object({
    deviceId: UUIDSchema,
    metricName: MetricNameSchema,
    startDate: z.string().datetime({ offset: true }),
    endDate: z.string().datetime({ offset: true }),
    resolution: ResolutionSchema,
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      const rangeMs = end - start;

      if (rangeMs <= 0) return false;

      if (data.resolution === '1s' && rangeMs > 2 * 60 * 60 * 1000) return false;
      if (data.resolution === '1m' && rangeMs > 7 * 24 * 60 * 60 * 1000) return false;

      const maxAllowedSpan = 31 * 24 * 60 * 60 * 1000;
      return rangeMs <= maxAllowedSpan;
    },
    {
      message: 'Invalid query range specified for requested resolution.',
      path: ['endDate'],
    }
  );

export const DashboardConfigSchema = z.object({
  widgets: z.array(
    z.object({
      id: UUIDSchema,
      type: z.enum(['line-chart', 'bar-chart', 'gauge', 'table']),
      title: z.string().min(1).max(100),
      deviceId: UUIDSchema,
      metricName: MetricNameSchema,
      position: z.object({
        x: z.number().int().min(0),
        y: z.number().int().min(0),
        w: z.number().int().min(1).max(12),
        h: z.number().int().min(1).max(12),
      }),
      config: z.record(z.unknown()),
    })
  ),
  layout: z.object({
    columns: z.number().int().min(1).max(12).default(12),
    rowHeight: z.number().int().min(10).max(200).default(50),
    margin: z.tuple([z.number().int().min(0), z.number().int().min(0)]).default([10, 10]),
  }),
  theme: z.enum(['light', 'dark']).default('light'),
});

export type MetricQuery = z.infer<typeof MetricQuerySchema>;
export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;
export type TelemetryPoint = z.infer<typeof TelemetryPointSchema>;
export type AggregatedTelemetry = z.infer<typeof AggregatedTelemetrySchema>;
export type Tenant = z.infer<typeof TenantSchema>;
export type Device = z.infer<typeof DeviceSchema>;
export type CreateDevice = z.infer<typeof CreateDeviceSchema>;
export type UpdateDevice = z.infer<typeof UpdateDeviceSchema>;