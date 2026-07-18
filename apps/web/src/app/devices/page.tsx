'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDevices, useDeviceMetadata } from '@/hooks/use-api';
import { Header } from '@/components/ui/Header';
import { Card, Button, Badge, LoadingSpinner, Input } from '@/components/ui/common';
import { Providers } from '@/components/Providers';
import { METRIC_DISPLAY_NAMES, METRIC_UNITS, type Device, type MetricName } from '@/types';

function DevicesContent() {
  const { data: devices, error, isLoading, mutate } = useDevices();
  const { data: metadata } = useDeviceMetadata();
  const [search, setSearch] = useState('');

  const filteredDevices = devices?.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.id.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const getDeviceMeta = (deviceId: string) => metadata?.find((m: any) => m.device_id === deviceId);

  const getStatusBadge = (status: Device['status']) => {
    switch (status) {
      case 'active': return <Badge variant="success">{status}</Badge>;
      case 'maintenance': return <Badge variant="warning">{status}</Badge>;
      case 'error': return <Badge variant="danger">{status}</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Devices</h1>
            <p className="text-gray-600 mt-1">Manage and monitor your industrial devices</p>
          </div>
          <Link href="/devices/new">
            <Button>Add Device</Button>
          </Link>
        </div>

        <Card className="mb-6">
          <Input
            placeholder="Search devices by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Card>
            <p className="text-red-600">Failed to load devices: {error.message}</p>
            <Button onClick={() => mutate()} variant="secondary" className="mt-4">
              Retry
            </Button>
          </Card>
        ) : filteredDevices.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">No devices found</p>
              <Link href="/devices/new" className="mt-4 inline-block">
                <Button>Create your first device</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDevices.map((device: Device) => {
              const meta = getDeviceMeta(device.id);
              return (
                <Card key={device.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 truncate">{device.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 font-mono">{device.id.slice(0, 8)}...</p>
                    </div>
                    {getStatusBadge(device.status)}
                  </div>
                  
                  {meta && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Location</span>
                        <span className="font-medium">{meta.location}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Type</span>
                        <span className="font-medium capitalize">{meta.tags?.type || 'Unknown'}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Link href={`/telemetry?device=${device.id}`}>
                      <Button className="w-full" variant="secondary" size="sm">
                        View Telemetry
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function DevicesPage() {
  return (
    <Providers>
      <DevicesContent />
    </Providers>
  );
}