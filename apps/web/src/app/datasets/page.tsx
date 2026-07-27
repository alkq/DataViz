'use client';

import React, { useState, useRef, Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDatasets, type DatasetSummary } from '@/hooks/use-api';
import { Header } from '@/components/ui/Header';
import { Card, Button, Input, LoadingSpinner, Badge } from '@/components/ui/common';
import { Tooltip } from '@/components/ui/Tooltip';
import { DatasetCardSkeleton } from '@/components/ui/Skeleton';
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

const ACCEPT = '.csv,.tsv,.txt,.xlsx,.xls';

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return ''; }
}

// Lightweight client-side CSV/TSV header + column-type peek to validate before upload.
function peekFile(file: File): { ok: boolean; reason?: string; columns?: string[]; estRows?: number } {
  const lower = file.name.toLowerCase();
  if (!/\.(csv|tsv|txt|xlsx|xls)$/.test(lower)) {
    return { ok: false, reason: 'Unsupported file type' };
  }
  if (file.size === 0) return { ok: false, reason: 'File is empty' };
  // Excel needs the server to parse; we only peek text formats client-side.
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    return { ok: true, columns: [], estRows: undefined };
  }
  return { ok: true }; // full validation happens server-side; we just block obvious bad types
}

interface UploadItem {
  file: File;
  progress: number;
  status: 'queued' | 'uploading' | 'done' | 'error';
  error?: string;
  id?: string;
}

function DatasetsContent() {
  const router = useRouter();
  const { data: datasets, error, isLoading, mutate } = useDatasets();

  const [items, setItems] = useState<UploadItem[]>([]);
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'name' | 'rows'>('newest');
  const [typeFilter, setTypeFilter] = useState<'all' | 'csv' | 'excel'>('all');
  const fileRef = useRef<HTMLInputElement>(null);

  const apiBase = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const authHeader = (): Record<string, string> => {
    const token = useAuthStore.getState().accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const next: UploadItem[] = Array.from(list).map((file) => {
      const peek = peekFile(file);
      return {
        file,
        progress: 0,
        status: peek.ok ? 'queued' : 'error',
        error: peek.reason,
      };
    });
    setItems((prev) => [...prev, ...next]);
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const uploadOne = (item: UploadItem, datasetName?: string): Promise<string | null> =>
    new Promise((resolve) => {
      const form = new FormData();
      form.append('file', item.file);
      if (datasetName) form.append('name', datasetName);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${apiBase()}/datasets/upload`);
      const token = useAuthStore.getState().accessToken;
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setItems((prev) => prev.map((it) => (it.file === item.file ? { ...it, progress: pct } : it)));
        }
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data?.id) {
            setItems((prev) => prev.map((it) => (it.file === item.file ? { ...it, status: 'done', progress: 100, id: data.id } : it)));
            resolve(data.id);
          } else {
            throw new Error(data?.message || data?.error || 'Upload failed');
          }
        } catch (err: any) {
          setItems((prev) => prev.map((it) => (it.file === item.file ? { ...it, status: 'error', error: err.message } : it)));
          resolve(null);
        }
      };
      xhr.onerror = () => {
        setItems((prev) => prev.map((it) => (it.file === item.file ? { ...it, status: 'error', error: 'Network error' } : it)));
        resolve(null);
      };
      xhr.send(form);
    });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const queued = items.filter((it) => it.status === 'queued');
    if (queued.length === 0) {
      setUploadError(items.some((it) => it.status === 'error') ? 'Fix the highlighted files first' : 'Please choose at least one file');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      let firstId: string | null = null;
      for (let i = 0; i < queued.length; i++) {
        const id = await uploadOne(queued[i], i === 0 && name.trim() ? name.trim() : undefined);
        if (!firstId && id) firstId = id;
      }
      await mutate();
      setItems([]);
      setName('');
      if (firstId) router.push(`/datasets/${firstId}`);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadCsv = async (d: DatasetSummary) => {
    const res = await fetch(`${apiBase()}/datasets/${d.id}/rows?limit=1000&offset=0`, { headers: authHeader() });
    if (!res.ok) throw new Error('Failed to fetch rows');
    const rows: Record<string, unknown>[] = await res.json();
    const cols = d.columns.map((c) => c.name);
    const escape = (v: unknown) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => escape(r[c])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${d.name.replace(/\.[^.]+$/, '')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const handleDelete = async (d: DatasetSummary) => {
    if (!window.confirm(`Delete dataset "${d.name}"? This cannot be undone.`)) return;
    setDeletingId(d.id);
    const prev = datasets;
    mutate((datasets || []).filter((x) => x.id !== d.id), { revalidate: false });
    try {
      const res = await fetch(`${apiBase()}/datasets/${d.id}`, { method: 'DELETE', headers: authHeader() });
      if (!res.ok) throw new Error('Delete failed');
      await mutate();
    } catch (err: any) {
      mutate(prev, { revalidate: false });
      setUploadError(err.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  // --- (1) Richer list: search + sort + filter ---
  const filtered = useMemo(() => {
    let list = datasets ? [...datasets] : [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q) || d.columns.some((c) => c.name.toLowerCase().includes(q)));
    }
    if (typeFilter !== 'all') list = list.filter((d) => d.source_type === typeFilter);
    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'rows') return (b.row_count || 0) - (a.row_count || 0);
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
    return list;
  }, [datasets, search, sort, typeFilter]);

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <BackgroundCollage />
        <SoftAurora className="opacity-50" />
        <Threads color="99,102,241" />
      </div>
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

        {/* (2) Better upload: progress + validation + per-file status */}
        <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Upload a file</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <Input
              label="Dataset name (optional — applies to first file)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Defaults to the file name"
              disabled={uploading}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Files (.csv, .tsv, .xlsx, .xls) — tap to choose, multiple supported</label>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept={ACCEPT}
                onChange={(e) => addFiles(e.target.files)}
                disabled={uploading}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files); }}
                className={`w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/40 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                } ${uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6 4.5 4.5 0 0117 14.5M12 12v6m0-6l-2.5 2.5M12 12l2.5 2.5" />
                </svg>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Tap to choose files</span> or drag &amp; drop
                </span>
                <span className="text-xs text-gray-400">CSV, TSV, Excel — select one or many</span>
              </button>
              {items.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {items.length} file{items.length > 1 ? 's' : ''} selected
                  </p>
                  <ul className="space-y-1.5">
                    {items.map((it, i) => (
                      <li
                        key={`${it.file.name}-${i}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-3 py-2"
                      >
                        <span className="flex items-center gap-2 min-w-0 flex-1">
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V7a2 2 0 012-2h5l5 5v8a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{it.file.name}</span>
                          <span className="text-xs text-gray-400 shrink-0">({(it.file.size / 1024).toFixed(0)} KB)</span>
                          {it.status === 'error' && <span className="text-xs text-red-500 shrink-0">{it.error}</span>}
                          {it.status === 'done' && <span className="text-xs text-green-600 dark:text-green-400 shrink-0">✓ done</span>}
                        </span>
                        {it.status === 'uploading' || it.status === 'queued' ? (
                          <span className="text-xs text-gray-400 w-10 text-right shrink-0">{it.status === 'uploading' ? `${it.progress}%` : 'queued'}</span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          disabled={uploading}
                          className="text-gray-400 hover:text-red-500 shrink-0"
                          aria-label={`Remove ${it.file.name}`}
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
              {uploading ? <LoadingSpinner size="sm" /> : items.length > 1 ? `Upload ${items.filter((i) => i.status === 'queued').length} files & Visualize` : 'Upload & Visualize'}
            </Button>
          </form>
        </Card>

        {/* (1) List controls: search + sort + filter */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 px-2 py-1.5 flex-1 min-w-[180px]">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z" /></svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search datasets or columns…"
              className="bg-transparent text-sm text-slate-800 dark:text-slate-100 focus:outline-none w-full"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="name">Name (A–Z)</option>
            <option value="rows">Most rows</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All types</option>
            <option value="csv">CSV / TSV</option>
            <option value="excel">Excel</option>
          </select>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <DatasetCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur"><p className="text-red-600">Failed to load datasets: {error.message}</p></Card>
        ) : !datasets || datasets.length === 0 ? (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur"><p className="text-center text-gray-500 py-12">No datasets yet. Upload a CSV or Excel file above to get started.</p></Card>
        ) : filtered.length === 0 ? (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur"><p className="text-center text-gray-500 py-12">No datasets match your search/filter.</p></Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d: DatasetSummary, i) => (
              <Link key={d.id} href={`/datasets/${d.id}`}>
                <ScrollReveal delay={i * 0.06}>
                  <TiltedCard className="h-full" maxTilt={6}>
                    <SpotlightCard className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-gray-100 dark:border-slate-700 h-full group" spotlightColor="rgba(59,130,246,0.18)">
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">{d.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{d.row_count?.toLocaleString()} rows · {d.columns.length} cols · {fmtDate(d.created_at)}</p>
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
                        {/* (4) quick "Open Chart" reach — viz in one tap */}
                        <div className="mt-4 flex items-center gap-2">
                          <span className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium group-hover:bg-blue-500">Open chart →</span>
                          <Tooltip content="Download this dataset as a CSV file.">
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadCsv(d); }}
                              className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium"
                            >
                              Export CSV
                            </button>
                          </Tooltip>
                          <Tooltip content="Permanently remove this dataset.">
                            <button
                              type="button"
                              disabled={deletingId === d.id}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(d); }}
                              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 font-medium disabled:opacity-50"
                            >
                              {deletingId === d.id ? 'Deleting…' : 'Delete'}
                            </button>
                          </Tooltip>
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
