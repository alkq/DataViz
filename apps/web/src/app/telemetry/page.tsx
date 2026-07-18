'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTelemetryQuery, useDevices, useDeviceMetadata } from '@/hooks/use-api';
import { Header } from '@/components/ui/Header';
import { Card, Button, Select, LoadingSpinner, Badge } from '@/components/ui/common';
import { Providers } from '@/components/Providers';
import { TelemetryLineChart, TelemetryBarChart, TelemetryGaugeChart } from '@/components/charts/TelemetryCharts';
import { METRIC_DISPLAY_NAMES, METRIC_UNITS, type MetricName, type Resolution, type TelemetryPoint } from '@/types';

const RESOLUTIONS: Array<{ value: Resolution; label: string }> = [
  { value: '1s', label: '1 Second (max 2 hours)' },
  { value: '1m', label: '1 Minute (max 7 days)' },
  { value: '5m', label: '5 Minutes (max 31 days)' },
  { value: '1h', label: '1 Hour (max 31 days)' },
  { value: '1d', label: '1 Day (max 31 days)' },
];

const METRICS: Array<{ value: MetricName; label: string }> = [
  { value: 'temperature', label: 'Temperature (°C)' },
  { value: 'pressure', label: 'Pressure (PSI)' },
  { value: 'flow_rate', label: 'Flow Rate (L/min)' },
  { value: 'amperage', label: 'Amperage (A)' },
];

function TelemetryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: devices } = useDevices();
  const { data: metadata } = useDeviceMetadata();

  const [deviceId, setDeviceId] = useState(searchParams.get('device') || '');
  const [metricName, setMetricName] = useState<MetricName>(
    (searchParams.get('metric') as MetricName) || 'temperature'
  );
  const [resolution, setResolution] = useState<Resolution>(
    (searchParams.get('resolution') as Resolution) || '1m'
  );
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || 
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || 
    new Date().toISOString().slice(0, 16)
  );
  const [chartType, setChartType] = useState<'line' | 'bar' | 'gauge'>('line');

  const { data: telemetry, error, isLoading, mutate } = useTelemetryQuery({
    deviceId,
    metricName,
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString(),
    resolution,
  });

  const selectedDevice = devices?.find(d => d.id === deviceId);
  const deviceMeta = metadata?.find((m: any) => m.device_id === deviceId);

  useEffect(() => {
    const params = new URLSearchParams();
    if (deviceId) params.set('device', deviceId);
    params.set('metric', metricName);
    params.set('startDate', new Date(startDate).toISOString());
    params.set('endDate', new Date(endDate).toISOString());
    params.set('resolution', resolution);
    router.push(`/telemetry?${params.toString()}`, { scroll: false });
  }, [deviceId, metricName, startDate, endDate, resolution, router]);

  const formatChartData = (data: TelemetryPoint[]) => data.map(d => ({
    timestamp: d.timestamp,
    value: d.value,
    annotation: d.annotation,
  }));

  if (!deviceId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Select a Device</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {devices?.map(device => (
                <Button
                  key={device.id}
                  variant={deviceId === device.id ? 'primary' : 'secondary'}
                  className="w-full text-left p-4 h-auto"
                  onClick={() => setDeviceId(device.id)}
                >
                  <h3 className="font-medium text-slate-900">{device.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{device.id.slice(0, 8)}...</p>
                  <Badge variant={device.status === 'active' ? 'success' : device.status === 'maintenance' ? 'warning' : 'default'} className="mt-2">
                    {device.status}
                  </Badge>
                </Button>
              ))}
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const unit = METRIC_UNITS[metricName];
  const displayName = METRIC_DISPLAY_NAMES[metricName];
  const chartData = formatChartData((telemetry?.data || []) as TelemetryPoint[]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{displayName} - {selectedDevice?.name}</h1>
              <p className="text-gray-600 mt-1">{selectedDevice?.id}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => mutate()}>
                Refresh
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <div className="grid gap-4 md:grid-cols-5">
              <Select
                label="Device"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                options={devices?.map(d => ({ value: d.id, label: d.name })) || []}
              />
              <Select
                label="Metric"
                value={metricName}
                onChange={(e) => setMetricName(e.target.value as MetricName)}
                options={METRICS}
              />
              <Select
                label="Resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value as Resolution)}
                options={RESOLUTIONS}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>

          <Card className="mb-6">
            <div className="flex gap-2 mb-4">
              {(['line', 'bar', 'gauge'] as const).map(type => (
                <Button
                  key={type}
                  variant={chartType === type ? 'primary' : 'secondary'}
                  onClick={() => setChartType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
              <div className="flex items-center gap-2 ml-auto text-sm text-gray-600">
                <span>{chartData.length} data points</span>
                <Badge variant="info">{resolution}</Badge>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">
                <p>Failed to load telemetry: {error.message}</p>
                <Button onClick={() => mutate()} variant="secondary" className="mt-4">
                  Retry
                </Button>
              </div>
            ) : chartData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No data available for the selected time range</p>
              </div>
            ) : (
              <div className="h-[500px]">
                {chartType === 'line' && (
                  <TelemetryLineChart 
                    data={chartData} 
                    metricName={displayName} 
                    unit={unit} 
                  />
                )}
                {chartType === 'bar' && (
                  <TelemetryBarChart 
                    data={chartData} 
                    metricName={displayName} 
                    unit={unit} 
                  />
                )}
                {chartType === 'gauge' && (
                  <TelemetryGaugeChart 
                    data={chartData} 
                    metricName={displayName} 
                    unit={unit} 
                    min={metricName === 'temperature' ? -20 : 0}
                    max={metricName === 'temperature' ? 150 : metricName === 'pressure' ? 5000 : metricName === 'flow_rate' ? 1000 : 100}
                  />
                )}
              </div>
            )}

            {deviceMeta && (
              <div className="mt-6 pt-6 border-t border-gray-200 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{deviceMeta.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium capitalize">{deviceMeta.tags?.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unit</p>
                  <p className="font-medium">{deviceMeta.tags?.unit}</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function TelemetryPage() {
  return (
    <Providers>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-2">Loading telemetry view...</p>
          </div>
        </div>
      }>
        <TelemetryContent />
      </Suspense>
    </Providers>
  );
}