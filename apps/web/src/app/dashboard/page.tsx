'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Header } from '@/components/ui/Header';
import { Providers } from '@/components/Providers';
import { Card, LoadingSpinner, Badge, Button } from '@/components/ui/common';
import { useDatasets } from '@/hooks/use-api';
import Link from 'next/link';

function StatCard({ label, value, icon, tint }: { label: string; value: string; icon: React.ReactNode; tint: string }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${tint}`}>{icon}</div>
      </div>
    </Card>
  );
}

function DashboardContent() {
  const { user, isAuthenticated, hydrated } = useAuthStore();
  const { data: datasets, isLoading } = useDatasets();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [hydrated, isAuthenticated]);

  if (!hydrated || !isAuthenticated) return null;

  const totalDatasets = datasets?.length || 0;
  const totalRows = datasets?.reduce((s, d) => s + (d.row_count || 0), 0) || 0;
  const totalCols = datasets?.reduce((s, d) => s + (d.columns?.length || 0), 0) || 0;
  const lastImport = datasets && datasets.length
    ? new Date(Math.max(...datasets.map((d) => new Date(d.created_at).getTime()))).toLocaleDateString()
    : '—';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Datasets"
            value={String(totalDatasets)}
            tint="bg-blue-100 text-blue-600"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16" /></svg>}
          />
          <StatCard
            label="Total Rows"
            value={totalRows.toLocaleString()}
            tint="bg-green-100 text-green-600"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          />
          <StatCard
            label="Columns Analyzed"
            value={totalCols.toLocaleString()}
            tint="bg-purple-100 text-purple-600"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
          />
          <StatCard
            label="Last Import"
            value={lastImport}
            tint="bg-amber-100 text-amber-600"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>

        {/* Recent Datasets history */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Recent Datasets</h2>
            <Link href="/datasets" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {isLoading ? (
            <Card><div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div></Card>
          ) : !datasets || datasets.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 py-8">
                No datasets imported yet.{' '}
                <Link href="/datasets" className="text-blue-600 hover:underline">Upload your first file</Link>.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {datasets.slice(0, 6).map((d) => (
                <Link key={d.id} href={`/datasets/${d.id}`}>
                  <Card className="hover:shadow-md transition-shadow h-full">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-slate-900 truncate">{d.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{d.row_count} rows · {d.columns.length} cols</p>
                      </div>
                      <Badge variant={d.source_type === 'excel' ? 'info' : 'default'}>{d.source_type.toUpperCase()}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {d.columns.slice(0, 4).map((c) => (
                        <span key={c.name} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{c.name}</span>
                      ))}
                      {d.columns.length > 4 && <span className="text-xs px-2 py-0.5 text-gray-400">+{d.columns.length - 4}</span>}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/datasets">
              <Button className="w-full justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Import a file
              </Button>
            </Link>
            <Link href="/sources">
              <Button variant="secondary" className="w-full justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16" />
                </svg>
                View Data Sources
              </Button>
            </Link>
            <Link href="/datasets">
              <Button variant="secondary" className="w-full justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analyze Data
              </Button>
            </Link>
          </div>
        </Card>
      </main>
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
