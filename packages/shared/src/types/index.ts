export interface Tenant {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Device {
  id: string;
  tenantId: string;
  name: string;
  status: DeviceStatus;
  createdAt: Date;
}

export type DeviceStatus = 'active' | 'inactive' | 'maintenance' | 'error';

export interface TelemetryPoint {
  timestamp: Date;
  tenantId: string;
  deviceId: string;
  metricName: MetricName;
  metricValue: number;
}

export type MetricName = 'temperature' | 'pressure' | 'flow_rate' | 'amperage';

export interface AggregatedTelemetry {
  timestamp: Date;
  tenantId: string;
  deviceId: string;
  metricName: MetricName;
  avgValue: number;
  maxValue: number;
  minValue: number;
  countRecords: number;
}

export interface DashboardConfig {
  widgets: WidgetConfig[];
  layout: LayoutConfig;
  theme: 'light' | 'dark';
}

export interface WidgetConfig {
  id: string;
  type: 'line-chart' | 'bar-chart' | 'gauge' | 'table';
  title: string;
  deviceId: string;
  metricName: MetricName;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>;
}

export interface LayoutConfig {
  columns: number;
  rowHeight: number;
  margin: [number, number];
}