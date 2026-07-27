'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import { useTheme } from 'next-themes';

type Row = Record<string, unknown>;
// Chart types mirror the Bklit UI chart menu (area / bar / candlestick / choropleth /
// composed / funnel / gauge / heatmap / line / profit-loss / live / PIE / radar / scatter / sankey)
// plus our histogram. We implement the ones that map cleanly to tabular data.
type ChartType =
  | 'line'
  | 'area'
  | 'bar'
  | 'scatter'
  | 'histogram'
  | 'pie'
  | 'radar'
  | 'composed';

interface DatasetChartProps {
  rows: Row[];
  xColumn: string;
  yColumn: string;
  chartType: ChartType;
  height?: number;
  onChartReady?: (chart: echarts.ECharts | null) => void;
}

function toNumber(v: unknown): number {
  if (v === null || v === undefined || v === '') return NaN;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
  return isNaN(n) ? NaN : n;
}

// Stable color palette (Bklit-ish blues/teals/violets).
const PALETTE = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6'];

export function DatasetChart({ rows, xColumn, yColumn, chartType, height = 420, onChartReady }: DatasetChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const { theme = 'light' } = useTheme();

  const isHistogram = chartType === 'histogram';
  const isPie = chartType === 'pie';
  const isRadar = chartType === 'radar';

  const { points, xIsNumeric } = useMemo(() => {
    const srcCol = isHistogram ? yColumn : xColumn;
    const pts = rows
      .map((r) => ({ x: r[srcCol], y: toNumber(r[yColumn]) }))
      .filter((p) => !isHistogram || !isNaN(toNumber(p.x)));
    const numericX = pts.length > 0 && pts.every((p) => !isNaN(toNumber(p.x)));
    return { points: pts, xIsNumeric: numericX };
  }, [rows, xColumn, yColumn, isHistogram]);

  const chartOptions = useMemo(() => {
    const isDark = theme === 'dark';
    const textColor = isDark ? '#e2e8f0' : '#475569';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const axisColor = isDark ? '#64748b' : '#94a3b8';
    const legendColor = isDark ? '#cbd5e1' : '#475569';
    const baseTooltip = { trigger: 'axis', backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: gridColor, textStyle: { color: textColor } };

    // ---- HISTOGRAM: bin a single numeric column ----
    if (isHistogram) {
      const values = points.map((p) => toNumber(p.x)).filter((v) => !isNaN(v));
      const min = values.length ? Math.min(...values) : 0;
      const max = values.length ? Math.max(...values) : 1;
      const binCount = Math.min(20, Math.max(5, Math.round(Math.sqrt(values.length)) || 5));
      const width = (max - min) / binCount || 1;
      const bins: Record<string, number> = {};
      for (const v of values) {
        const idx = Math.min(binCount - 1, Math.floor((v - min) / width));
        const label = `${(min + idx * width).toFixed(1)} to ${(min + (idx + 1) * width).toFixed(1)}`;
        bins[label] = (bins[label] || 0) + 1;
      }
      const cats = Object.keys(bins);
      return {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: gridColor, textStyle: { color: textColor } },
        grid: { left: 70, right: 30, top: 20, bottom: 70 },
        xAxis: { type: 'category', data: cats, axisLine: { lineStyle: { color: axisColor } }, axisLabel: { color: textColor, fontSize: 10, rotate: cats.length > 8 ? 30 : 0, hideOverlap: true }, name: xColumn, nameLocation: 'middle', nameGap: 38, nameTextStyle: { color: textColor } },
        yAxis: { type: 'value', axisLine: { lineStyle: { color: axisColor } }, axisLabel: { color: textColor }, splitLine: { lineStyle: { color: gridColor, type: 'dashed' } }, name: 'Count', nameTextStyle: { color: textColor } },
        series: [{ name: 'Count', type: 'bar', data: cats.map((c) => bins[c]), itemStyle: { color: '#3b82f6' }, barCategoryGap: '10%' }],
        animationDuration: 300,
      };
    }

    // ---- PIE: sum y per x category ----
    if (isPie) {
      const agg: Record<string, number> = {};
      for (const p of points) {
        const k = String(p.x ?? '—');
        agg[k] = (agg[k] || 0) + (isNaN(p.y) ? 0 : p.y);
      }
      const pieData = Object.keys(agg).map((k) => ({ name: k, value: agg[k] }));
      return {
        backgroundColor: 'transparent',
        color: PALETTE,
        tooltip: { trigger: 'item', backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: gridColor, textStyle: { color: textColor }, formatter: '{b}: {c} ({d}%)' },
        legend: { bottom: 0, textStyle: { color: legendColor }, type: 'scroll' },
        series: [{ name: yColumn, type: 'pie', radius: ['38%', '68%'], center: ['50%', '46%'], data: pieData, label: { color: textColor }, itemStyle: { borderColor: isDark ? '#0f172a' : '#fff', borderWidth: 2 } }],
        animationDuration: 300,
      };
    }

    // ---- RADAR: one axis per x category, value = y ----
    if (isRadar) {
      const cats = Array.from(new Set(points.map((p) => String(p.x ?? '—')))).slice(0, 12);
      const maxV = Math.max(1, ...points.map((p) => (isNaN(p.y) ? 0 : p.y)));
      return {
        backgroundColor: 'transparent',
        color: PALETTE,
        tooltip: { trigger: 'item', backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: gridColor, textStyle: { color: textColor } },
        legend: { bottom: 0, textStyle: { color: legendColor } },
        radar: {
          indicator: cats.map((c) => ({ name: c, max: maxV })),
          nameGap: 8,
          splitLine: { lineStyle: { color: gridColor } },
          splitArea: { areaStyle: { color: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.05)' } },
          axisLine: { lineStyle: { color: gridColor } },
        },
        series: [{ type: 'radar', data: [{ value: cats.map((c) => { const hit = points.find((p) => String(p.x) === c); return hit ? (isNaN(hit.y) ? 0 : hit.y) : 0; }), name: yColumn, areaStyle: { opacity: 0.25 } }] }],
        animationDuration: 300,
      };
    }

    // ---- LINE / AREA / BAR / SCATTER / COMPOSED ----
    const seriesData = points.map((p) => {
      const xv = xIsNumeric ? toNumber(p.x) : String(p.x);
      return [xv, p.y];
    });

    const seriesType: 'line' | 'bar' | 'scatter' =
      chartType === 'scatter' ? 'scatter' : chartType === 'bar' ? 'bar' : 'line';

    // Composed = line + bar overlay (Bklit "composed" style) when both make sense.
    const series =
      chartType === 'composed'
        ? [
            { name: yColumn + ' (bar)', type: 'bar', data: seriesData, itemStyle: { color: 'rgba(59,130,246,0.55)' } },
            { name: yColumn + ' (line)', type: 'line', data: seriesData, smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { color: '#06b6d4', width: 2 }, itemStyle: { color: '#06b6d4' } },
          ]
        : [
            {
              name: yColumn,
              type: seriesType,
              data: seriesData,
              showSymbol: chartType === 'line' || chartType === 'area' ? points.length <= 60 : chartType === 'scatter' ? true : false,
              symbolSize: chartType === 'scatter' ? 10 : undefined,
              sampling: 'lttb',
              smooth: chartType === 'line' || chartType === 'area',
              itemStyle: { color: '#3b82f6' },
              lineStyle: { color: '#3b82f6', width: 2 },
              areaStyle: chartType === 'area' ? { color: isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.12)' } : undefined,
            },
          ];

    return {
      backgroundColor: 'transparent',
      tooltip: baseTooltip,
      legend: series.length > 1 ? { bottom: 0, textStyle: { color: legendColor } } : undefined,
      grid: { left: 70, right: 30, top: 20, bottom: 50 },
      xAxis: {
        type: xIsNumeric ? 'value' : 'category',
        data: xIsNumeric ? undefined : points.map((p) => String(p.x)),
        axisLine: { lineStyle: { color: axisColor } },
        axisLabel: { color: textColor, fontSize: 11, hideOverlap: true },
        splitLine: { show: false },
        name: xColumn,
        nameLocation: 'middle',
        nameGap: 38,
        nameTextStyle: { color: textColor },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: axisColor } },
        axisLabel: { color: textColor, fontSize: 12 },
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
        name: yColumn,
        nameTextStyle: { color: textColor },
      },
      series,
      animationDuration: 300,
    };
  }, [points, xIsNumeric, xColumn, yColumn, chartType, isHistogram, isPie, isRadar, theme]);

  // Init the chart once per theme/onChartReady. Resize + option updates are
  // handled by the effect below so fullscreen/height changes re-render correctly.
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, theme);
    chartInstanceRef.current = chart;
    onChartReady?.(chart);
    chart.setOption(chartOptions);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(chartRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
      onChartReady?.(null);
      chart.dispose();
      chartInstanceRef.current = null;
    };
  }, [theme, onChartReady]);

  // Re-apply option + resize whenever the data/type/height changes.
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;
    chart.setOption(chartOptions, true);
    chart.resize();
  }, [chartOptions, height]);

  if (points.length === 0) {
    return <div className="text-center text-gray-500 py-12">No numeric data to plot for the selected columns.</div>;
  }

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: `${height}px` }}
      role="img"
      aria-label={`${chartType} chart of ${yColumn} by ${xColumn}`}
    />
  );
}
