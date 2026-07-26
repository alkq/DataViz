import useSWR, { type SWRConfiguration } from 'swr';
import { createApiClient } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Device, TelemetryResponse, Dashboard } from '@/types';

// Gate every authed fetch on auth hydration + a present token. Without this,
// SWR fires on first render while the persisted token is still null (zustand
// rehydrates async), the API 401s, and with revalidateOnFocus:false the error
// sticks — so returning users see empty/zero datasets.
function authedFetcher(url: string) {
  const { accessToken } = useAuthStore.getState();
  return createApiClient(() => accessToken).get<any>(url);
}

function useAuthedSWR<T>(key: string | null, config?: SWRConfiguration) {
  const hydrated = useAuthStore((s) => s.hydrated);
  const hasToken = useAuthStore((s) => !!s.accessToken);
  const enabled = hydrated && hasToken;
  return useSWR<T>(enabled ? key : null, authedFetcher as any, {
    revalidateOnFocus: true,
    // Keep last good data on screen during transient errors (cold starts).
    keepPreviousData: true,
    errorRetryCount: 3,
    errorRetryInterval: 2000,
    shouldRetryOnError: true,
    // De-dupe identical requests within 5s so tab switches / re-renders
    // don't refetch the same data, and cache results briefly.
    dedupingInterval: 5000,
    // Revalidate in the background every 60s so data stays fresh
    // without blocking the UI; keepPreviousData shows the cached view meanwhile.
    revalidateOnReconnect: true,
    ...config,
  });
}

export function useDevices() {
  return useAuthedSWR<Device[]>('/devices');
}

export function useDevice(id: string) {
  return useAuthedSWR<Device>(id ? `/devices/${id}` : null);
}

export function useTelemetryQuery(params: {
  deviceId: string;
  metricName: string;
  startDate: string;
  endDate: string;
  resolution: string;
}) {
  const queryString = new URLSearchParams(params as Record<string, string>).toString();
  return useAuthedSWR<TelemetryResponse>(`/telemetry/query?${queryString}`, {
    dedupingInterval: 30000,
  });
}

export function useDeviceMetadata() {
  return useAuthedSWR<any[]>('/telemetry/devices/metadata');
}

export function useDashboards() {
  return useAuthedSWR<Dashboard[]>('/dashboards');
}

export function useDefaultDashboard() {
  return useAuthedSWR<Dashboard>('/dashboards/default');
}

export function useDashboard(id: string) {
  return useAuthedSWR<Dashboard>(id ? `/dashboards/${id}` : null);
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
  return useAuthedSWR<DatasetSummary[]>('/datasets');
}

export function useDataset(id: string | string[]) {
  return useAuthedSWR<DatasetSummary>(id ? `/datasets/${id}` : null);
}

export function useDatasetRows(id: string | string[], limit = 200, offset = 0) {
  return useAuthedSWR<Record<string, unknown>[]>(
    id ? `/datasets/${id}/rows?limit=${limit}&offset=${offset}` : null,
  );
}