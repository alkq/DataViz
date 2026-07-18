import useSWR from 'swr';
import { createApiClient } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Device, TelemetryResponse, Dashboard } from '@/types';

const fetcher = (url: string) => 
  createApiClient(() => useAuthStore.getState().accessToken).get<any>(url);

export function useDevices() {
  return useSWR<Device[]>('/devices', fetcher, { revalidateOnFocus: false });
}

export function useDevice(id: string) {
  return useSWR<Device>(id ? `/devices/${id}` : null, fetcher, { revalidateOnFocus: false });
}

export function useTelemetryQuery(params: {
  deviceId: string;
  metricName: string;
  startDate: string;
  endDate: string;
  resolution: string;
}) {
  const queryString = new URLSearchParams(params as Record<string, string>).toString();
  return useSWR<TelemetryResponse>(`/telemetry/query?${queryString}`, fetcher, { 
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
}

export function useDeviceMetadata() {
  return useSWR<any[]>('/telemetry/devices/metadata', fetcher, { revalidateOnFocus: false });
}

export function useDashboards() {
  return useSWR<Dashboard[]>('/dashboards', fetcher, { revalidateOnFocus: false });
}

export function useDefaultDashboard() {
  return useSWR<Dashboard>('/dashboards/default', fetcher, { revalidateOnFocus: false });
}

export function useDashboard(id: string) {
  return useSWR<Dashboard>(id ? `/dashboards/${id}` : null, fetcher, { revalidateOnFocus: false });
}

export interface DatasetSummary {
  id: string;
  tenant_id: string;
  name: string;
  source_type: 'csv' | 'excel';
  original_filename: string;
  columns: { name: string; type: 'number' | 'date' | 'text' }[];
  row_count: number;
  created_at: string;
}

export function useDatasets() {
  return useSWR<DatasetSummary[]>('/datasets', fetcher, { revalidateOnFocus: false });
}

export function useDataset(id: string | string[]) {
  return useSWR<DatasetSummary>(id ? `/datasets/${id}` : null, fetcher, { revalidateOnFocus: false });
}

export function useDatasetRows(id: string | string[], limit = 200, offset = 0) {
  return useSWR<Record<string, unknown>[]>(
    id ? `/datasets/${id}/rows?limit=${limit}&offset=${offset}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );
}