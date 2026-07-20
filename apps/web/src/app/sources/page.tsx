'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useDatasets, type DatasetSummary } from '@/hooks/use-api';
import { Header } from '@/components/ui/Header';
import { Card, Button, LoadingSpinner, Badge } from '@/components/ui/common';
import { Providers } from '@/components/Providers';

function SourcesContent() {
  const { data: datasets, error, isLoading } = useDatasets();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Data Sources</h1>
            <p className="text-gray-600 mt-1">
              Every file you import becomes a reusable data source you can revisit and re-analyse.
            </p>
          </div>
          <Link href="/datasets">
            <Button>Import a file</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : error ? (
          <Card><p className="text-red-600">Failed to load sources: {error.message}</p></Card>
        ) : !datasets || datasets.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-12">
              No data sources yet.{' '}
              <Link href="/datasets" className="text-blue-600 hover:underline">Import your first file</Link>{' '}
              to create one.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {datasets.map((d: DatasetSummary) => (
              <Link key={d.id} href={`/datasets/${d.id}`}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 truncate">{d.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {d.row_count.toLocaleString()} rows · {d.columns.length} columns
                      </p>
                    </div>
                    <Badge variant={d.source_type === 'excel' ? 'info' : 'default'}>
                      {d.source_type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-1">
                    {d.columns.slice(0, 6).map((c) => (
                      <span key={c.name} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {c.name} <span className="text-gray-400">· {c.type}</span>
                      </span>
                    ))}
                    {d.columns.length > 6 && (
                      <span className="text-xs px-2 py-0.5 text-gray-400">+{d.columns.length - 6}</span>
                    )}
                  </div>
                  <p className="mt-4 text-xs text-gray-400">
                    Imported {new Date(d.created_at).toLocaleDateString()} ·{' '}
                    {new Date(d.created_at).toLocaleTimeString()}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SourcesPage() {
  return (
    <Providers>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
        <SourcesContent />
      </Suspense>
    </Providers>
  );
}
