'use client';

import React, { useState, Suspense, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDataset, useDatasetRows, type DatasetSummary } from '@/hooks/use-api';
import { Header } from '@/components/ui/Header';
import { Card, Button, LoadingSpinner } from '@/components/ui/common';
import { CustomSelect } from '@/components/ui/Dropdown';
import { Providers } from '@/components/Providers';
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

  const numberCols = useMemo(
    () => (dataset?.columns || []).filter((c) => c.type === 'number').map((c) => c.name),
    [dataset],
  );
  const allCols = useMemo(() => (dataset?.columns || []).map((c) => c.name), [dataset]);

  const [yColumn, setYColumn] = useState<string>('');
  const [xColumn, setXColumn] = useState<string>('');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Formula state
  const [formula, setFormula] = useState('');
  const [calcName, setCalcName] = useState('calculated');
  const [calcError, setCalcError] = useState('');
  const [calcCol, setCalcCol] = useState<string | null>(null);

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
        <div className="mt-2 mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{dataset?.name || 'Dataset'}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {dataset?.row_count} rows · {dataset?.columns.length} columns · {dataset?.source_type.toUpperCase()}
          </p>
        </div>

        {dataset && (
          <Card className="mb-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
            <div className="grid gap-4 md:grid-cols-4">
              <CustomSelect
                label="X axis (category / value)"
                value={effectiveX}
                onChange={(v) => setXColumn(v)}
                options={allCols.map((c) => ({ value: c, label: c }))}
              />
              <CustomSelect
                label="Y axis (numeric)"
                value={effectiveY}
                onChange={(v) => setYColumn(v)}
                options={(numberCols.length ? numberCols : allCols).map((c) => ({ value: c, label: c }))}
              />
              <CustomSelect
                label="Chart type"
                value={chartType}
                onChange={(v) => setChartType(v as 'line' | 'bar')}
                options={[{ value: 'line', label: 'Line' }, { value: 'bar', label: 'Bar' }]}
              />
              <div className="flex items-end">
                <Button variant="secondary" className="w-full sm:w-auto" onClick={() => { setXColumn(''); setYColumn(''); }}>
                  Reset
                </Button>
              </div>
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
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Visualization</h2>
          {isLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : rowsError ? (
            <p className="text-red-600">Failed to load rows: {rowsError.message}</p>
          ) : (
            <DatasetChart
              rows={displayRows || []}
              xColumn={calcCol && effectiveX === calcCol ? effectiveX : effectiveX}
              yColumn={calcCol || effectiveY}
              chartType={chartType}
            />
          )}
        </Card>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Data preview</h2>
          {isLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : !displayRows || displayRows.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No rows.</p>
          ) : (
            (() => {
              const cols = calcCol && !allCols.includes(calcCol) ? [...allCols, calcCol] : allCols;
              return (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-600">
                        {cols.map((c) => (
                          <th key={c} className="px-3 py-2 font-medium whitespace-nowrap">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayRows.slice(0, 100).map((r, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-slate-700">
                          {cols.map((c) => (
                            <td key={c} className="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-slate-300">{String(r[c] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()
          )}
          {displayRows && displayRows.length > 100 && (
            <p className="text-xs text-gray-400 mt-2">Showing first 100 of {displayRows.length} rows.</p>
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
