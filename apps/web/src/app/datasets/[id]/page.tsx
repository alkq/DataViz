'use client';

import React, { useState, Suspense, useMemo, useEffect } from 'react';
import type * as echarts from 'echarts';
import { useTheme } from 'next-themes';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDataset, useDatasetRows, useDatasets, type DatasetSummary } from '@/hooks/use-api';
import { warmUpApi } from '@/lib/keepalive';
import { Header } from '@/components/ui/Header';
import { Card, Button, LoadingSpinner } from '@/components/ui/common';
import { CustomSelect } from '@/components/ui/Dropdown';
import { Tooltip } from '@/components/ui/Tooltip';
import { Skeleton } from '@/components/ui/Skeleton';
import { Providers } from '@/components/Providers';
import { useAuthStore } from '@/lib/auth-store';
import { DatasetChart } from '@/components/charts/DatasetChart';
import { BackgroundCollage } from '@/components/reactbits/BackgroundCollage';
import { SoftAurora } from '@/components/reactbits/SoftAurora';
import { Threads } from '@/components/reactbits/Threads';

type Row = Record<string, unknown>;

function toNumber(v: unknown): number {
  if (v === null || v === undefined || v === '') return NaN;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
  return isNaN(n) ? NaN : n;
}

// ---- Safe formula evaluator -------------------------------------------------
// Supports + - * / % ^, parentheses, numbers, and column names (letters/_).
// No eval / Function — we tokenize and evaluate via shunting-yard.
function evalFormula(formula: string, row: Row, cols: string[]): number {
  const colSet = new Set(cols.map((c) => c.toLowerCase()));
  const tokens = formula.match(/\(|\)|\+|-|\*|\/|%|\^|[A-Za-z_][A-Za-z0-9_]*|\d+\.?\d*/g);
  if (!tokens) throw new Error('Empty formula');
  const output: Array<{ t: 'n'; v: number } | { t: 'o'; v: string }> = [];
  const ops: string[] = [];
  const prec: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3 };
  const ra: Record<string, number> = { '+': 2, '-': 2, '*': 2, '/': 2, '%': 2, '^': 2 };
  const apply = (op: string) => {
    const b = (output.pop() as { t: 'n'; v: number }).v;
    const a = (output.pop() as { t: 'n'; v: number }).v;
    let r = 0;
    switch (op) {
      case '+': r = a + b; break;
      case '-': r = a - b; break;
      case '*': r = a * b; break;
      case '/': r = b === 0 ? NaN : a / b; break;
      case '%': r = b === 0 ? NaN : a % b; break;
      case '^': r = Math.pow(a, b); break;
    }
    output.push({ t: 'n', v: r });
  };
  for (const tk of tokens) {
    if (/^\d+\.?\d*$/.test(tk)) {
      output.push({ t: 'n', v: parseFloat(tk) });
    } else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(tk)) {
      const key = cols.find((c) => c.toLowerCase() === tk.toLowerCase());
      if (!key || !colSet.has(tk.toLowerCase())) throw new Error(`Unknown column "${tk}"`);
      output.push({ t: 'n', v: toNumber(row[key]) });
    } else if ('+-*/%^'.includes(tk)) {
      while (ops.length && prec[ops[ops.length - 1]] >= prec[tk] && ra[tk] === 2) apply(ops.pop()!);
      ops.push(tk);
    } else if (tk === '(') {
      ops.push(tk);
    } else if (tk === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') apply(ops.pop()!);
      if (ops.pop() !== '(') throw new Error('Mismatched parentheses');
    } else {
      throw new Error(`Invalid token "${tk}"`);
    }
  }
  while (ops.length) {
    const o = ops.pop()!;
    if (o === '(' || o === ')') throw new Error('Mismatched parentheses');
    apply(o);
  }
  if (output.length !== 1) throw new Error('Invalid formula');
  return (output[0] as { t: 'n'; v: number }).v;
}

function aggregate(values: number[]) {
  const nums = values.filter((n) => !isNaN(n));
  if (nums.length === 0) return { sum: NaN, avg: NaN, min: NaN, max: NaN, count: 0 };
  const sum = nums.reduce((a, b) => a + b, 0);
  return {
    sum,
    avg: sum / nums.length,
    min: Math.min(...nums),
    max: Math.max(...nums),
    count: nums.length,
  };
}

function DatasetViewContent() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const { data: dataset } = useDataset(id);
  const { data: rows, error: rowsError, isLoading } = useDatasetRows(id, 500, 0);

  // (4) Compare with another dataset: overlay its first numeric column.
  const [compareId, setCompareId] = useState<string>('');
  const { data: compareRows, error: compareError } = useDatasetRows(compareId, 500, 0);
  const { data: compareMeta } = useDataset(compareId);
  const { data: allDatasets } = useDatasets();

  const numberCols = useMemo(
    () => (dataset?.columns || []).filter((c) => c.type === 'number').map((c) => c.name),
    [dataset],
  );
  const allCols = useMemo(() => (dataset?.columns || []).map((c) => c.name), [dataset]);

  const [yColumn, setYColumn] = useState<string>('');
  const [xColumn, setXColumn] = useState<string>('');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'scatter' | 'histogram' | 'pie' | 'radar' | 'composed'>('line');

  // Formula state
  const [formula, setFormula] = useState('');
  const [calcName, setCalcName] = useState('calculated');
  const [calcError, setCalcError] = useState('');
  const [calcCol, setCalcCol] = useState<string | null>(null);

  const [showData, setShowData] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartWrapRef = React.useRef<HTMLDivElement>(null);
  const [chartInstance, setChartInstance] = useState<echarts.ECharts | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const { theme } = useTheme();
  // Data table interactions (ported from the Python/Altair table viewer)
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [colMenu, setColMenu] = useState<string | null>(null);
  const [visOpen, setVisOpen] = useState(false);

  const visibleCols = useMemo(
    () => (calcCol && !allCols.includes(calcCol) ? [...allCols, calcCol] : allCols).filter((c) => !hiddenCols.has(c)),
    [allCols, calcCol, hiddenCols],
  );

  const toggleSort = (c: string) => {
    if (sortCol === c) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(c); setSortDir('asc'); }
  };

  const exportCsvFromRows = (rowsToExport: Record<string, unknown>[], cols: string[], filename: string) => {
    const escape = (v: unknown) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [cols.join(','), ...rowsToExport.map((r) => cols.map((c) => escape(r[c])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportChart = (type: 'png' | 'svg') => {
    if (!chartInstance) return;
    const url = chartInstance.getDataURL({ type, pixelRatio: 2, backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff' });
    const a = document.createElement('a');
    a.href = url;
    a.download = `chart.${type}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setMenuOpen(false);
  };

  const toggleFullscreen = () => {
    const el = chartWrapRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };
  useEffect(() => {
    warmUpApi();
  }, []);
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const effectiveY = yColumn || numberCols[0] || allCols[1] || allCols[0] || '';
  const effectiveX = xColumn || allCols[0] || '';

  // Build computed rows when a formula is valid.
  const computedRows = useMemo<Row[]>(() => {
    if (!formula.trim() || !rows) return rows || [];
    try {
      const result = rows.map((r) => {
        const v = evalFormula(formula, r, allCols);
        return { ...r, [calcName || 'calculated']: isNaN(v) ? null : v };
      });
      setCalcError('');
      setCalcCol(calcName || 'calculated');
      return result;
    } catch (e: any) {
      setCalcError(e.message || 'Invalid formula');
      setCalcCol(null);
      return rows;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formula, rows, allCols, calcName]);

  const stats = useMemo(() => {
    if (!rows) return [];
    return numberCols.map((c) => ({ col: c, ...aggregate(rows.map((r) => toNumber(r[c]))) }));
  }, [rows, numberCols]);

  const displayRows = formula.trim() ? computedRows : rows;

  // Comparison dataset: auto-pick first text col as X, first numeric as Y.
  const compareSeries = React.useMemo(() => {
    if (!compareId || !compareRows || !compareMeta) return null;
    const cols = compareMeta.columns || [];
    const xc = cols.find((c) => c.type !== 'number')?.name || cols[0]?.name;
    const yc = cols.find((c) => c.type === 'number')?.name;
    if (!xc || !yc) return null;
    return { xColumn: xc, yColumn: yc, rows: compareRows, name: compareMeta.name };
  }, [compareId, compareRows, compareMeta]);

  const tableRows = React.useMemo(() => {
    let rowsArr = displayRows || [];
    if (search.trim()) {
      const q = search.toLowerCase();
      rowsArr = rowsArr.filter((r) => visibleCols.some((c) => String(r[c] ?? '').toLowerCase().includes(q)));
    }
    if (sortCol) {
      rowsArr = [...rowsArr].sort((a, b) => {
        const av = a[sortCol];
        const bv = b[sortCol];
        const an = toNumber(av);
        const bn = toNumber(bv);
        const useNum = !isNaN(an) && !isNaN(bn);
        const cmp = useNum ? an - bn : String(av ?? '').localeCompare(String(bv ?? ''));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rowsArr;
  }, [displayRows, search, sortCol, sortDir, visibleCols]);

  const downloadCsv = async () => {
    if (!dataset || !id) return;
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const token = useAuthStore.getState().accessToken;
    const res = await fetch(`${base}/datasets/${id}/rows?limit=1000&offset=0`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const dataRows: Record<string, unknown>[] = await res.json();
    const cols = dataset.columns.map((c) => c.name);
    const escape = (v: unknown) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [cols.join(','), ...dataRows.map((r) => cols.map((c) => escape(r[c])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.name.replace(/\.[^.]+$/, '')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <BackgroundCollage />
        <SoftAurora className="opacity-50" />
        <Threads color="99,102,241" />
      </div>
      <Header />
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/datasets" className="text-sm text-blue-600 hover:underline">← All datasets</Link>
        <div className="mt-2 mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{dataset?.name || 'Dataset'}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {dataset?.row_count} rows · {dataset?.columns.length} columns · {dataset?.source_type.toUpperCase()}
            </p>
          </div>
          <Tooltip content="Download all rows as a CSV file.">
            <Button variant="secondary" onClick={downloadCsv} className="shrink-0">Export CSV</Button>
          </Tooltip>
        </div>

        {dataset && (
          <Card className="relative z-20 mb-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
            <div className="grid gap-4 md:grid-cols-4">
              <CustomSelect
                label="X axis (category / value)"
                value={effectiveX}
                onChange={(v) => setXColumn(v)}
                options={allCols.map((c) => ({ value: c, label: c }))}
              />
              {chartType !== 'histogram' && chartType !== 'pie' && chartType !== 'radar' && (
              <CustomSelect
                label={chartType === 'composed' ? 'Y axis (numeric, bar+line)' : 'Y axis (numeric)'}
                value={effectiveY}
                onChange={(v) => setYColumn(v)}
                options={(numberCols.length ? numberCols : allCols).map((c) => ({ value: c, label: c }))}
              />
              )}
              {chartType === 'histogram' && (
                <CustomSelect
                  label="Column to bin"
                  value={effectiveY}
                  onChange={(v) => setYColumn(v)}
                  options={(numberCols.length ? numberCols : allCols).map((c) => ({ value: c, label: c }))}
                />
              )}
              <CustomSelect
                label="Chart type"
                value={chartType}
                onChange={(v) => setChartType(v as 'line' | 'area' | 'bar' | 'scatter' | 'histogram' | 'pie' | 'radar' | 'composed')}
                options={[
                  { value: 'line', label: 'Line' },
                  { value: 'area', label: 'Area' },
                  { value: 'bar', label: 'Bar' },
                  { value: 'scatter', label: 'Scatter' },
                  { value: 'histogram', label: 'Histogram' },
                  { value: 'pie', label: 'Pie' },
                  { value: 'radar', label: 'Radar' },
                  { value: 'composed', label: 'Composed' },
                ]}
              />
              <div className="flex items-end">
                <Button variant="secondary" className="w-full sm:w-auto" onClick={() => { setXColumn(''); setYColumn(''); }}>Reset</Button>
              </div>
              <CustomSelect
                label="Compare with"
                value={compareId}
                onChange={(v) => setCompareId(v)}
                options={[
                  { value: '', label: 'None' },
                  ...(allDatasets || []).filter((d) => d.id !== id).map((d) => ({ value: d.id, label: d.name })),
                ]}
              />
            </div>
          </Card>
        )}

        {/* Calculator: aggregates + formula */}
        <Card className="mb-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Calculate</h2>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Aggregate stats */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Column summaries</h3>
              {stats.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No numeric columns to summarise.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-600">
                        <th className="px-3 py-2 font-medium">Column</th>
                        <th className="px-3 py-2 font-medium">Sum</th>
                        <th className="px-3 py-2 font-medium">Avg</th>
                        <th className="px-3 py-2 font-medium">Min</th>
                        <th className="px-3 py-2 font-medium">Max</th>
                        <th className="px-3 py-2 font-medium">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map((s) => (
                        <tr key={s.col} className="border-b border-gray-100 dark:border-slate-700">
                          <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200">{s.col}</td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{isNaN(s.sum) ? '—' : s.sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{isNaN(s.avg) ? '—' : s.avg.toFixed(2)}</td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{isNaN(s.min) ? '—' : s.min.toFixed(2)}</td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{isNaN(s.max) ? '—' : s.max.toFixed(2)}</td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{s.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Formula box */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Formula (new column)</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Use column names, e.g. <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">price * qty + 10</code>. Supports + - * / % ^ and ( ).
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  value={calcName}
                  onChange={(e) => setCalcName(e.target.value)}
                  placeholder="new column name"
                  className="flex-1 text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <input
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  placeholder="price * 2 + tax"
                  className="flex-1 text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button variant="secondary" onClick={() => { setFormula(''); setCalcCol(null); }}>
                  Clear
                </Button>
              </div>
              {calcError && <p className="text-red-600 text-sm mt-2">{calcError}</p>}
              {calcCol && (
                <p className="text-green-600 dark:text-green-400 text-sm mt-2">
                  ✓ Added column “{calcCol}” — see it in the chart and table below.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="mb-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Visualization</h2>
            <div className="flex items-center gap-2">
              {numberCols[0] && (() => {
                const numCol = numberCols[0];
                const vals = (rows || []).map((r) => toNumber(r[numCol])).filter((v) => !isNaN(v));
                const total = vals.reduce((s, v) => s + v, 0);
                const avg = vals.length ? total / vals.length : NaN;
                return (
                  <div className="hidden sm:flex items-center gap-4 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Total {numCol}: <span className="font-semibold text-slate-800 dark:text-slate-100">{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                    <span className="text-gray-500 dark:text-gray-400">Avg: <span className="font-semibold text-slate-800 dark:text-slate-100">{isNaN(avg) ? '—' : avg.toFixed(2)}</span></span>
                  </div>
                );
              })()}
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-[420px] w-full rounded-xl" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          ) : rowsError ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-50/60 dark:bg-amber-900/20 px-4 py-3">
              <p className="text-amber-700 dark:text-amber-300 text-sm font-medium">The API is waking up after idle — give it ~30s and it'll load automatically.</p>
              <p className="text-amber-600/80 dark:text-amber-400/70 text-xs mt-1">If it doesn't, refresh the page. (detail: {rowsError.message})</p>
            </div>
          ) : (
            <div ref={chartWrapRef} className="relative">
              <DatasetChart
                rows={displayRows || []}
                xColumn={calcCol && effectiveX === calcCol ? effectiveX : effectiveX}
                yColumn={calcCol || effectiveY}
                chartType={chartType}
                height={isFullscreen ? Math.max(420, (typeof window !== 'undefined' ? window.innerHeight - 160 : 480)) : 420}
                onChartReady={setChartInstance}
              />
              {/* Floating control cluster (matches the requested feature) */}
              <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-2">
                <Tooltip content={showData ? 'Hide the data table' : 'Show the data table'} side="left">
                  <button
                    type="button"
                    onClick={() => setShowData((v) => !v)}
                    className="rounded-full bg-slate-700/90 hover:bg-slate-600 text-white text-sm px-4 py-2 shadow-lg backdrop-blur"
                  >
                    {showData ? 'Hide data' : 'Show data'}
                  </button>
                </Tooltip>
                <div className="flex items-center gap-1 rounded-lg bg-slate-800/90 p-1 shadow-lg backdrop-blur">
                  <Tooltip content="Toggle data table" side="left">
                    <button
                      type="button"
                      onClick={() => setShowData((v) => !v)}
                      aria-label="Toggle data table"
                      title="Toggle data table"
                      className={`p-2 rounded ${showData ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-slate-700'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </Tooltip>
                  <Tooltip content={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} side="left">
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      aria-label="Toggle fullscreen"
                      title="Toggle fullscreen"
                      className="p-2 rounded text-gray-200 hover:bg-slate-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          )}
          {showData && (
            <div className="mt-4">
              {/* Table toolbar (search, column visibility, CSV, ⋯ menu) */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 px-2 py-1.5 flex-1 min-w-[160px]">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z" /></svg>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search rows…"
                    className="bg-transparent text-sm text-slate-800 dark:text-slate-100 focus:outline-none w-full"
                  />
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setVisOpen((v) => !v)}
                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    Columns {visibleCols.length}/{allCols.length + (calcCol && !allCols.includes(calcCol) ? 1 : 0)}
                  </button>
                  {visOpen && (
                    <div className="absolute right-0 mt-1 z-30 w-56 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl p-2">
                      <button
                        type="button"
                        onClick={() => setHiddenCols(new Set())}
                        className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-blue-600 font-medium"
                      >
                        Select all
                      </button>
                      <div className="my-1 border-t border-gray-100 dark:border-slate-700" />
                      {(calcCol && !allCols.includes(calcCol) ? [...allCols, calcCol] : allCols).map((c) => (
                        <label key={c} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200">
                          <input
                            type="checkbox"
                            checked={!hiddenCols.has(c)}
                            onChange={(e) => {
                              setHiddenCols((prev) => {
                                const n = new Set(prev);
                                if (e.target.checked) n.delete(c); else n.add(c);
                                return n;
                              });
                            }}
                            className="accent-blue-600"
                          />
                          {c}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => exportCsvFromRows(tableRows, visibleCols, `${dataset?.name?.replace(/\.[^.]+$/, '') || 'dataset'}.csv`)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
                  Download CSV
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label="More options"
                    className="w-8 h-8 grid place-items-center rounded-full border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-1 z-30 w-48 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1 text-sm">
                      <button type="button" onClick={() => exportChart('png')} className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200">Save as PNG</button>
                      <button type="button" onClick={() => exportChart('svg')} className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200">Save as SVG</button>
                      <button type="button" onClick={() => { setSourceOpen(true); setMenuOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200">View Source</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-600">
                      <th className="px-3 py-2 font-medium whitespace-nowrap">#</th>
                      {visibleCols.map((c) => (
                        <th key={c} className="px-3 py-2 font-medium whitespace-nowrap group relative">
                          <button type="button" onClick={() => toggleSort(c)} className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white">
                            {c}
                            {sortCol === c && <span className="text-blue-500">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                          </button>
                          <button
                            type="button"
                            onClick={() => setColMenu(colMenu === c ? null : c)}
                            className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            aria-label={`${c} options`}
                          >
                            <svg className="w-3.5 h-3.5 inline" fill="currentColor" viewBox="0 0 24 24"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
                          </button>
                          {colMenu === c && (
                            <div className="absolute left-0 mt-1 z-30 w-44 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1 text-sm">
                              <button type="button" onClick={() => { toggleSort(c); setColMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200">Sort ascending</button>
                              <button type="button" onClick={() => { setSortCol(c); setSortDir('desc'); setColMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200">Sort descending</button>
                              <button type="button" onClick={() => { setHiddenCols((prev) => new Set(prev).add(c)); setColMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200">Hide column</button>
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.slice(0, 100).map((r, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-slate-700">
                        <td className="px-3 py-2 whitespace-nowrap text-gray-400">{i}</td>
                        {visibleCols.map((c) => (
                          <td key={c} className="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-slate-300">{String(r[c] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {tableRows.length > 100 && (
                <p className="text-xs text-gray-400 mt-2">Showing first 100 of {tableRows.length} rows.</p>
              )}
            </div>
          )}
          {sourceOpen && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setSourceOpen(false)}>
              <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-2xl max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Chart source (ECharts option)</h3>
                  <button type="button" onClick={() => setSourceOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
                </div>
                <pre className="p-4 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{chartInstance ? JSON.stringify(chartInstance.getOption(), null, 2) : '// chart not ready'}</pre>
              </div>
            </div>
          )}
        </Card>

        {/* (4) Comparison chart: overlay another dataset's first numeric column */}
        {compareSeries && (
          <Card className="mb-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Comparison: <span className="text-blue-600 dark:text-blue-400">{compareSeries.name}</span>
              </h2>
              <Button variant="secondary" className="text-xs" onClick={() => setCompareId('')}>Clear</Button>
            </div>
            {compareError ? (
              <p className="text-red-600 text-sm">Could not load comparison data.</p>
            ) : (
              <DatasetChart
                rows={compareSeries.rows || []}
                xColumn={compareSeries.xColumn}
                yColumn={compareSeries.yColumn}
                chartType={chartType === 'pie' || chartType === 'radar' || chartType === 'histogram' ? 'bar' : chartType}
                height={360}
              />
            )}
          </Card>
        )}

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Data preview</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Use the <span className="font-medium">Show data</span> button on the chart above to open the interactive table — search, sort, hide columns, and export.</p>
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
