'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDatasets, type DatasetSummary } from '@/hooks/use-api';
import { Header } from '@/components/ui/Header';
import { Card, Button, Input, LoadingSpinner, Badge } from '@/components/ui/common';
import { Providers } from '@/components/Providers';
import { Aurora } from '@/components/reactbits/Aurora';
import { ShinyText } from '@/components/reactbits/ShinyText';
import { SpotlightCard } from '@/components/reactbits/SpotlightCard';
import { TiltedCard } from '@/components/reactbits/TiltedCard';
import { Dither } from '@/components/reactbits/Dither';
import { ScrollReveal } from '@/components/reactbits/ScrollReveal';
import { BackgroundCollage } from '@/components/reactbits/BackgroundCollage';
import { Threads } from '@/components/reactbits/Threads';
import { SoftAurora } from '@/components/reactbits/SoftAurora';
import { useAuthStore } from '@/lib/auth-store';
function DatasetsContent() {
  const router = useRouter();
  const { data: datasets, error, isLoading, mutate } = useDatasets();

  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setUploadError('Please choose at least one file');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = useAuthStore.getState().accessToken;
      let firstId: string | null = null;
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const form = new FormData();
        form.append('file', f);
        if (i === 0 && name.trim()) form.append('name', name.trim());
        const res = await fetch(`${base}/datasets/upload`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || `Upload failed for ${f.name}`);
        if (!firstId) firstId = data.id;
      }
      await mutate();
      setFiles([]);
      setName('');
      if (firstId) router.push(`/datasets/${firstId}`);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
      <BackgroundCollage />
      <SoftAurora className="opacity-50" />
      <Threads color="99,102,241" />
      <Header />
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero strip with aurora accent */}
        <section className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-gray-100 dark:border-slate-700 mb-8">
          <Aurora className="opacity-20 dark:opacity-40" />
          <Dither className="opacity-30" color1="#1e3a8a" color2="#0f172a" />
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500" />
          <div className="relative px-6 py-8 sm:px-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              <ShinyText text="Datasets" speed={5} />
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Upload CSV / Excel files and visualize their data</p>
          </div>
        </section>

        <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Files (.csv, .tsv, .xlsx, .xls) — you can select multiple</label>
              <input
                type="file"
                multiple
                accept=".csv,.tsv,.txt,.xlsx,.xls"
                onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {files.length} file{files.length > 1 ? 's' : ''} selected
                  </p>
                  <ul className="space-y-1.5">
                    {files.map((f, i) => (
                      <li
                        key={`${f.name}-${i}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-3 py-2"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V7a2 2 0 012-2h5l5 5v8a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{f.name}</span>
                          <span className="text-xs text-gray-400 shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                          disabled={uploading}
                          className="text-gray-400 hover:text-red-500 shrink-0"
                          aria-label={`Remove ${f.name}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur"><p className="text-red-600">Failed to load datasets: {error.message}</p></Card>
        ) : !datasets || datasets.length === 0 ? (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur"><p className="text-center text-gray-500 py-12">No datasets yet. Upload a CSV or Excel file above to get started.</p></Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {datasets.map((d: DatasetSummary, i) => (
            <Link key={d.id} href={`/datasets/${d.id}`}>
              <ScrollReveal delay={i * 0.06}>
                <TiltedCard className="h-full" maxTilt={6}>
                  <SpotlightCard className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-gray-100 dark:border-slate-700 h-full group" spotlightColor="rgba(59,130,246,0.18)">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">{d.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{d.row_count} rows · {d.columns.length} cols</p>
                        </div>
                        <Badge variant={d.source_type === 'excel' ? 'info' : 'default'}>{d.source_type.toUpperCase()}</Badge>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex flex-wrap gap-1">
                        {d.columns.slice(0, 6).map((c) => (
                          <span key={c.name} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                            {c.name} <span className="text-gray-400">· {c.type}</span>
                          </span>
                        ))}
                        {d.columns.length > 6 && <span className="text-xs px-2 py-0.5 text-gray-400">+{d.columns.length - 6}</span>}
                      </div>
                    </div>
                  </SpotlightCard>
                </TiltedCard>
              </ScrollReveal>
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
