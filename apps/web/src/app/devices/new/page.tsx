'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { createApiClient } from '@/lib/api';
import { Header } from '@/components/ui/Header';
import { Card, Button, Input, Select, LoadingSpinner } from '@/components/ui/common';

function NewDeviceContent() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);

  const [name, setName] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'maintenance' | 'error'>('inactive');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Device name is required');
      return;
    }

    setLoading(true);
    setError('');

    // Build the metadata object only with provided optional fields.
    const metadata: Record<string, unknown> = {};
    if (location.trim()) metadata.location = location.trim();
    if (type.trim()) metadata.type = type.trim();

    try {
      const client = createApiClient(() => useAuthStore.getState().accessToken);
      await client.post('/devices', {
        name: name.trim(),
        status,
        metadata,
      });
      router.push('/devices');
    } catch (err: any) {
      setError(err.message || 'Failed to create device. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Add Device</h1>
            <p className="text-gray-600 mt-1">Register a new industrial device</p>
          </div>
          <Link href="/devices">
            <Button variant="secondary">Cancel</Button>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Device Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Temperature Sensor A1"
              disabled={loading}
              required
            />

            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              disabled={loading}
              options={[
                { value: 'inactive', label: 'Inactive' },
                { value: 'active', label: 'Active' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'error', label: 'Error' },
              ]}
            />

            <Input
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Factory Floor A"
              disabled={loading}
            />

            <Input
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g. sensor"
              disabled={loading}
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : 'Create Device'}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}

export default function NewDevicePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <NewDeviceContent />
    </Suspense>
  );
}
