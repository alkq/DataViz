'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Header } from '@/components/ui/Header';
import { Providers } from '@/components/Providers';
import { Card, LoadingSpinner, Badge, Button } from '@/components/ui/common';
import { useDevices } from '@/hooks/use-api';
import { Device } from '@/types';
import Link from 'next/link';

function DashboardContent() {
  const { user, isAuthenticated } = useAuthStore();
  const { data: devices, error, isLoading, mutate } = useDevices();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const activeDevices = devices?.filter(d => d.status === 'active').length || 0;
  const totalDevices = devices?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Devices</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{totalDevices}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Devices</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{activeDevices}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {devices?.filter(d => d.status === 'maintenance').length || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {devices?.filter(d => d.status === 'error').length || 0}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full text-red-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Devices" className="lg:col-span-2">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <div className="text-red-600 text-center py-4">Failed to load devices</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm font-medium text-gray-500 border-b border-gray-200">
                      <th className="pb-3 px-4">Name</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 px-4">Last Updated</th>
                      <th className="pb-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {devices?.map(device => (
                      <tr key={device.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-900">{device.name}</div>
                          <div className="text-sm text-gray-500">{device.id.slice(0, 8)}...</div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            variant={device.status === 'active' ? 'success' : 
                                     device.status === 'maintenance' ? 'warning' : 
                                     device.status === 'error' ? 'danger' : 'default'}
                          >
                            {device.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {new Date(device.updated_at).toLocaleString()}
                        </td>
                        <td className="py-4 px-4">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => setSelectedDevice(device)}
                          >
                            View Telemetry
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {devices?.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No devices found. <Link href="/devices" className="text-blue-600 hover:underline">Add one</Link>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card title="Quick Actions">
            <div className="space-y-3">
              <Link href="/devices">
                <Button variant="secondary" className="w-full justify-start">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Manage Devices
                </Button>
              </Link>
              <Link href="/telemetry">
                <Button variant="secondary" className="w-full justify-start">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Telemetry
                </Button>
              </Link>
              <Button variant="secondary" className="w-full justify-start" onClick={() => mutate()}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Data
              </Button>
            </div>
          </Card>
        </div>
      </main>

      {selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDevice(null)}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-slate-900">{selectedDevice.name} - Telemetry</h2>
              <button onClick={() => setSelectedDevice(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <Link href={`/telemetry?device=${selectedDevice.id}`}>
                <Button onClick={() => setSelectedDevice(null)} size="lg" className="w-full">
                  Open Full Telemetry View
                </Button>
              </Link>
              <p className="text-sm text-gray-500 text-center mt-3">
                Device ID: {selectedDevice.id} | Status: <span className="font-medium capitalize">{selectedDevice.status}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Providers>
      <DashboardContent />
    </Providers>
  );
}