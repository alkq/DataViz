'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useDatasets, type DatasetSummary } from '@/hooks/use-api';
import { Header } from '@/components/ui/Header';
import { Card, Button, LoadingSpinner, Badge } from '@/components/ui/common';
import { Providers } from '@/components/Providers';
import { Aurora } from '@/components/reactbits/Aurora';
import { ShinyText } from '@/components/reactbits/ShinyText';
import { SpotlightCard } from '@/components/reactbits/SpotlightCard';

function SourcesContent() {
  const { data: datasets, error, isLoading } = useDatasets();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero strip with aurora accent */}
        <section className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 mb-8">
          <Aurora className="opacity-20 dark:opacity-40" />
          <div className="relative flex items-center justify-between flex-wrap gap-4 px-6 py-8 sm:px-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                <ShinyText text="Data Sources" speed={5} />
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Every file you import becomes a reusable data source you can revisit and re-analyse.
              </p>
            </div>
            <Link href="/datasets">
              <Button>Import a file</Button>
            </Link>
          </div>
        </section>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : error ? (
          <Card><p className="text-red-600">Failed to load sources: {error.message}</p></Card>
        ) : !datasets || datasets.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">
              No data sources yet.{' '}
              <Link href="/datasets" className="text-blue-600 hover:underline">Import your first file</Link>{' '}
              to create one.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {datasets.map((d: DatasetSummary) => (
              <Link key={d.id} href={`/datasets/${d.id}`}>
                <SpotlightCard className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 h-full group" spotlightColor="rgba(59,130,246,0.18)">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">{d.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {d.row_count.toLocaleString()} rows · {d.columns.length} columns
                        </p>
                      </div>
                      <Badge variant={d.source_type === 'excel' ? 'info' : 'default'}>
                        {d.source_type.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex flex-wrap gap-1">
                      {d.columns.slice(0, 6).map((c) => (
                        <span key={c.name} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
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
                  </div>
                </SpotlightCard>
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
