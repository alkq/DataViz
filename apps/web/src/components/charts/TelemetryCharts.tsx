'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import DOMPurify from 'isomorphic-dompurify';
import { useTheme } from 'next-themes';

interface MetricPoint {
  timestamp: string;
  value: number;
  annotation?: string;
}

interface TelemetryLineChartProps {
  data: MetricPoint[];
  metricName: string;
  unit?: string;
  nonce?: string;
}

export function TelemetryLineChart({ data, metricName, unit = '', nonce }: TelemetryLineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const { theme = 'light' } = useTheme();

  const chartOptions = useMemo(() => {
    const formattedData = data.map(point => [
      new Date(point.timestamp),
      point.value,
      point.annotation || '',
    ]);

    const isDark = theme === 'dark';
    const textColor = isDark ? '#e2e8f0' : '#475569';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const axisColor = isDark ? '#64748b' : '#94a3b8';
    const lineColor = '#3b82f6';
    const areaColor = isDark 
      ? 'rgba(59, 130, 246, 0.15)' 
      : 'rgba(59, 130, 246, 0.1)';

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: textColor },
        formatter: (params: any): string => {
          const value = params[0].value;
          const date = value[0] instanceof Date 
            ? value[0].toISOString() 
            : new Date(value[0]).toISOString();
          const cleanAnnotation = DOMPurify.sanitize(value[2] || '', {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: [],
          });
          
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${date}</div>
            <div style="color: ${lineColor};">Value: ${value[1].toFixed(2)} ${unit}</div>
            ${cleanAnnotation ? `<div style="font-size: 12px; margin-top: 4px; opacity: 0.8;">Comment: <strong>${cleanAnnotation}</strong></div>` : ''}
          `;
        },
      },
      grid: {
        left: 60,
        right: 30,
        top: 20,
        bottom: 60,
      },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: axisColor } },
        axisLabel: { color: textColor, fontSize: 12 },
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: axisColor } },
        axisLabel: { 
          color: textColor, 
          fontSize: 12,
          formatter: (value: number) => `${value.toLocaleString()}${unit ? ' ' + unit : ''}`,
        },
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
      },
      series: [
        {
          name: metricName,
          type: 'line',
          showSymbol: false,
          data: formattedData,
          sampling: 'lttb',
          lineStyle: { color: lineColor, width: 2 },
          areaStyle: { color: areaColor },
          emphasis: { focus: 'series' },
        },
      ],
      animationDuration: 300,
      animationEasing: 'cubicOut' as any,
    };
  }, [data, metricName, unit, theme]);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, theme);
    chartInstanceRef.current = chart;
    chart.setOption(chartOptions);

    const handleResize = () => chartInstanceRef.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, [chartOptions, theme]);

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: '400px' }}
      aria-label={`Telemetry chart for ${metricName}`}
      role="img"
    />
  );
}

export function TelemetryBarChart({ data, metricName, unit = '', nonce }: TelemetryLineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const { theme = 'light' } = useTheme();

  const chartOptions = useMemo(() => {
    const formattedData = data.map(point => ({
      value: point.value,
      timestamp: point.timestamp,
      annotation: point.annotation || '',
    }));

    const isDark = theme === 'dark';
    const textColor = isDark ? '#e2e8f0' : '#475569';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const axisColor = isDark ? '#64748b' : '#94a3b8';
    const barColor = '#3b82f6';

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: textColor },
        formatter: (params: any): string => {
          const item = params[0];
          const cleanAnnotation = DOMPurify.sanitize(item.data.annotation || '', {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: [],
          });
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${new Date(item.data.timestamp).toISOString()}</div>
            <div style="color: ${barColor};">Value: ${item.value.toFixed(2)} ${unit}</div>
            ${cleanAnnotation ? `<div style="font-size: 12px; margin-top: 4px; opacity: 0.8;">Comment: <strong>${cleanAnnotation}</strong></div>` : ''}
          `;
        },
      },
      grid: { left: 60, right: 30, top: 20, bottom: 60 },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: axisColor } },
        axisLabel: { color: textColor, fontSize: 12 },
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: axisColor } },
        axisLabel: { color: textColor, fontSize: 12, formatter: (v: number) => `${v.toLocaleString()}${unit ? ' ' + unit : ''}` },
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
      },
      series: [
        {
          name: metricName,
          type: 'bar',
          data: formattedData,
          sampling: 'lttb',
          itemStyle: { color: barColor },
          emphasis: { focus: 'series' },
        },
      ],
      animationDuration: 300,
      animationEasing: 'cubicOut' as any,
    };
  }, [data, metricName, unit, theme]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, theme);
    chartInstanceRef.current = chart;
    chart.setOption(chartOptions);

    const handleResize = () => chartInstanceRef.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, [chartOptions, theme]);

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: '400px' }}
      aria-label={`Bar chart for ${metricName}`}
      role="img"
    />
  );
}

export function TelemetryGaugeChart({ data, metricName, unit = '', min = 0, max = 100, nonce }: TelemetryLineChartProps & { min?: number; max?: number }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const { theme = 'light' } = useTheme();

  const latestValue = data[data.length - 1]?.value ?? 0;

  const chartOptions = useMemo(() => {
    const isDark = theme === 'dark';
    const textColor = isDark ? '#e2e8f0' : '#475569';

    return {
      backgroundColor: 'transparent',
      series: [
        {
          type: 'gauge',
          startAngle: 225,
          endAngle: -45,
          min,
          max,
          progress: { show: true, width: 20, roundCap: true },
          pointer: { show: false },
          axisLine: { lineStyle: { width: 20 } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false, distance: 30, color: textColor, fontSize: 14 },
          detail: {
            valueAnimation: true,
            formatter: (value: number) => `${value.toFixed(1)} ${unit}`,
            color: textColor,
            fontSize: 32,
            fontWeight: '600',
          },
          data: [{ value: latestValue, name: metricName }],
        },
      ],
    };
  }, [latestValue, metricName, unit, min, max, theme]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, theme);
    chartInstanceRef.current = chart;
    chart.setOption(chartOptions);

    const handleResize = () => chartInstanceRef.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, [chartOptions, theme]);

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: '300px' }}
      aria-label={`Gauge for ${metricName}: ${latestValue.toFixed(1)} ${unit}`}
      role="img"
    />
  );
}