export interface Device {
  id: string;
  tenant_id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TelemetryPoint {
  timestamp: string;
  value: number;
  annotation?: string;
}

export interface TelemetryResponse {
  data: TelemetryPoint[];
  resolution: string;
  aggregation?: 'raw' | 'hourly' | 'daily';
}

export interface DashboardConfig {
  widgets: Array<{
    id: string;
    type: 'line-chart' | 'bar-chart' | 'gauge' | 'table';
    title: string;
    deviceId: string;
    metricName: string;
    position: { x: number; y: number; w: number; h: number };
    config: Record<string, unknown>;
  }>;
  layout: {
    columns: number;
    rowHeight: number;
    margin: [number, number];
  };
  theme: 'light' | 'dark';
}

export interface Dashboard {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  config: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  sub: string;
  email: string;
  tenant_id: string;
  role: string;
  session_id: string;
}

export type MetricName = 'temperature' | 'pressure' | 'flow_rate' | 'amperage';
export type Resolution = '1s' | '1m' | '5m' | '1h' | '1d';

export const METRIC_UNITS: Record<MetricName, string> = {
  temperature: '°C',
  pressure: 'PSI',
  flow_rate: 'L/min',
  amperage: 'A',
};

export const METRIC_DISPLAY_NAMES: Record<MetricName, string> = {
  temperature: 'Temperature',
  pressure: 'Pressure',
  flow_rate: 'Flow Rate',
  amperage: 'Amperage',
};