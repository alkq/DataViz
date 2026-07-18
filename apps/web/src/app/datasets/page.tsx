'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDatasets, type DatasetSummary } from '@/hooks/use-api';
import { Header } from '@/components/ui/Header';
import { Card, Button, Input, LoadingSpinner, Badge } from '@/components/ui/common';
import { Providers } from '@/components/Providers';
import { createApiClient } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

function DatasetsContent() {
  const router = useRouter();
  const { data: datasets, error, isLoading, mutate } = useDatasets();

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please choose a CSV or Excel file');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const client = createApiClient(() => useAuthStore.getState().accessToken);
      const form = new FormData();
      form.append('file', file);
      if (name.trim()) form.append('name', name.trim());
      // Use the raw fetch path for multipart (api client only does JSON).
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(`${base}/datasets/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Upload failed');
      await mutate();
      setFile(null);
      setName('');
      router.push(`/datasets/${data.id}`);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Datasets</h1>
            <p className="text-gray-600 mt-1">Upload CSV / Excel files and visualize their data</p>
          </div>
        </div>

        <Card className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload a file</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <Input
              label="Dataset name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Defaults to the file name"
              disabled={uploading}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File (.csv, .tsv, .xlsx, .xls)</label>
              <input
                type="file"
                accept=".csv,.tsv,.txt,.xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={uploading}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            {uploadError && <p className="text-red-600 text-sm">{uploadError}</p>}
            <Button type="submit" disabled={uploading}>
              {uploading ? <LoadingSpinner size="sm" /> : 'Upload & Visualize'}
            </Button>
          </form>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : error ? (
          <Card><p className="text-red-600">Failed to load datasets: {error.message}</p></Card>
        ) : !datasets || datasets.length === 0 ? (
          <Card><p className="text-center text-gray-500 py-12">No datasets yet. Upload a CSV or Excel file above to get started.</p></Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {datasets.map((d: DatasetSummary) => (
              <Link key={d.id} href={`/datasets/${d.id}`}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 truncate">{d.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{d.row_count} rows · {d.columns.length} cols</p>
                    </div>
                    <Badge variant={d.source_type === 'excel' ? 'info' : 'default'}>{d.source_type.toUpperCase()}</Badge>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-1">
                    {d.columns.slice(0, 6).map((c) => (
                      <span key={c.name} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {c.name} <span className="text-gray-400">· {c.type}</span>
                      </span>
                    ))}
                    {d.columns.length > 6 && <span className="text-xs px-2 py-0.5 text-gray-400">+{d.columns.length - 6}</span>}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function DatasetsPage() {
  return (
    <Providers>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
        <DatasetsContent />
      </Suspense>
    </Providers>
  );
}
