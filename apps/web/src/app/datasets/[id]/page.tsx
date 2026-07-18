'use client';

import React, { useState, Suspense, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDataset, useDatasetRows, type DatasetSummary } from '@/hooks/use-api';
import { Header } from '@/components/ui/Header';
import { Card, Button, Select, LoadingSpinner } from '@/components/ui/common';
import { Providers } from '@/components/Providers';
import { DatasetChart } from '@/components/charts/DatasetChart';

function DatasetViewContent() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const { data: dataset, error: dsError } = useDataset(id);
  const { data: rows, error: rowsError, isLoading } = useDatasetRows(id, 500, 0);

  const numberCols = useMemo(
    () => (dataset?.columns || []).filter((c) => c.type === 'number').map((c) => c.name),
    [dataset],
  );
  const allCols = useMemo(() => (dataset?.columns || []).map((c) => c.name), [dataset]);

  const [yColumn, setYColumn] = useState<string>('');
  const [xColumn, setXColumn] = useState<string>('');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Default selections once data arrives.
  const effectiveY = yColumn || numberCols[0] || allCols[1] || allCols[0] || '';
  const effectiveX = xColumn || allCols[0] || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/datasets" className="text-sm text-blue-600 hover:underline">← All datasets</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-3xl font-bold text-slate-900">{dataset?.name || 'Dataset'}</h1>
          <p className="text-gray-600 mt-1">
            {dataset?.row_count} rows · {dataset?.columns.length} columns · {dataset?.source_type.toUpperCase()}
          </p>
        </div>

        {dsError && <Card><p className="text-red-600">Failed to load dataset: {dsError.message}</p></Card>}

        {dataset && (
          <Card className="mb-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Select
                label="X axis (category / value)"
                value={effectiveX}
                onChange={(e) => setXColumn(e.target.value)}
                options={allCols.map((c) => ({ value: c, label: c }))}
              />
              <Select
                label="Y axis (numeric)"
                value={effectiveY}
                onChange={(e) => setYColumn(e.target.value)}
                options={(numberCols.length ? numberCols : allCols).map((c) => ({ value: c, label: c }))}
              />
              <Select
                label="Chart type"
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'line' | 'bar')}
                options={[{ value: 'line', label: 'Line' }, { value: 'bar', label: 'Bar' }]}
              />
              <div className="flex items-end">
                <Button variant="secondary" onClick={() => { setXColumn(''); setYColumn(''); }}>
                  Reset
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Visualization</h2>
          {isLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : rowsError ? (
            <p className="text-red-600">Failed to load rows: {rowsError.message}</p>
          ) : (
            <DatasetChart rows={rows || []} xColumn={effectiveX} yColumn={effectiveY} chartType={chartType} />
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Data preview</h2>
          {isLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : !rows || rows.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No rows.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    {allCols.map((c) => (
                      <th key={c} className="px-3 py-2 font-medium whitespace-nowrap">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((r, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {allCols.map((c) => (
                        <td key={c} className="px-3 py-2 whitespace-nowrap text-gray-700">{String(r[c] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 100 && <p className="text-xs text-gray-400 mt-2">Showing first 100 of {rows.length} rows.</p>}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

export default function DatasetViewPage() {
  return (
    <Providers>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
        <DatasetViewContent />
      </Suspense>
    </Providers>
  );
}
