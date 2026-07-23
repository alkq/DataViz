'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Header } from '@/components/ui/Header';
import { Providers } from '@/components/Providers';
import { Card, LoadingSpinner, Badge, Button } from '@/components/ui/common';
import { useDatasets } from '@/hooks/use-api';
import { Aurora } from '@/components/reactbits/Aurora';
import { ShinyText } from '@/components/reactbits/ShinyText';
import { SpotlightCard } from '@/components/reactbits/SpotlightCard';
import { TiltedCard } from '@/components/reactbits/TiltedCard';
import { ClickSpark } from '@/components/reactbits/ClickSpark';
import { Dither } from '@/components/reactbits/Dither';
import { ScrollReveal } from '@/components/reactbits/ScrollReveal';
import { CountUp } from '@/components/reactbits/CountUp';
import { BackgroundCollage } from '@/components/reactbits/BackgroundCollage';
import { Threads } from '@/components/reactbits/Threads';
import { SoftAurora } from '@/components/reactbits/SoftAurora';
import Link from 'next/link';

function Icon({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-3 rounded-full ${className}`}>{children}</div>;
}

function DashboardContent() {
  const { user, isAuthenticated, hydrated } = useAuthStore();
  const { data: datasets, isLoading } = useDatasets();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [hydrated, isAuthenticated]);

  if (!hydrated || !isAuthenticated) return null;

  const totalDatasets = datasets?.length || 0;
  const totalRows = datasets?.reduce((s, d) => s + (d.row_count || 0), 0) || 0;
  const totalCols = datasets?.reduce((s, d) => s + (d.columns?.length || 0), 0) || 0;
  const lastImport = datasets && datasets.length
    ? new Date(Math.max(...datasets.map((d) => new Date(d.created_at).getTime()))).toLocaleDateString()
    : '—';

  const stats = [
    { label: 'Datasets', value: String(totalDatasets), tint: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16" /></svg> },
    { label: 'Total Rows', value: totalRows.toLocaleString(), tint: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { label: 'Columns Analyzed', value: totalCols.toLocaleString(), tint: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
    { label: 'Last Import', value: lastImport, tint: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

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
              <ShinyText text="Dashboard" speed={5} />
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Welcome back, <span className="font-medium text-slate-900 dark:text-slate-100">{user?.email}</span></p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((s, i) => (
            <ScrollReveal key={s.label} delay={i * 0.08}>
              <SpotlightCard className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-gray-100 dark:border-slate-700 group" spotlightColor="rgba(59,130,246,0.18)">
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{s.label}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {i < 3 ? <CountUp to={Number(s.value.replace(/,/g, '')) || 0} /> : s.value}
                    </p>
                  </div>
                  <Icon className={s.tint}>{s.icon}</Icon>
                </div>
              </SpotlightCard>
            </ScrollReveal>
          ))}
        </div>

        {/* Recent Datasets history */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Recent Datasets</h2>
            <Link href="/datasets" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {isLoading ? (
            <Card><div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div></Card>
          ) : !datasets || datasets.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No datasets imported yet.{' '}
                <Link href="/datasets" className="text-blue-600 hover:underline">Upload your first file</Link>.
              </p>
            </Card>
          ) : (
            <ScrollReveal>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {datasets.slice(0, 6).map((d, i) => (
                  <Link key={d.id} href={`/datasets/${d.id}`}>
                    <ScrollReveal delay={i * 0.06}>
                      <TiltedCard className="h-full" maxTilt={6}>
                        <SpotlightCard className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-gray-100 dark:border-slate-700 h-full group" spotlightColor="rgba(59,130,246,0.18)">
                          <div className="p-5">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">{d.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{d.row_count} rows · {d.columns.length} cols</p>
                              </div>
                              <Badge variant={d.source_type === 'excel' ? 'info' : 'default'}>{d.source_type.toUpperCase()}</Badge>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1">
                              {d.columns.slice(0, 4).map((c) => (
                                <span key={c.name} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">{c.name}</span>
                              ))}
                              {d.columns.length > 4 && <span className="text-xs px-2 py-0.5 text-gray-400">+{d.columns.length - 4}</span>}
                            </div>
                          </div>
                        </SpotlightCard>
                      </TiltedCard>
                    </ScrollReveal>
                  </Link>
                ))}
              </div>
            </ScrollReveal>
          )}
        </div>

        {/* Quick Actions */}
        <Card title="Quick Actions" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur">
          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/datasets">
              <ClickSpark>
                <Button className="w-full justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Import a file
                </Button>
              </ClickSpark>
            </Link>
            <Link href="/sources">
              <Button variant="secondary" className="w-full justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16" />
                </svg>
                View Data Sources
              </Button>
            </Link>
            <Link href="/datasets">
              <Button variant="secondary" className="w-full justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analyze Data
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Providers>
      <DashboardContent />
    </Providers>
  );
}
