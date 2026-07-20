'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useEffect } from 'react';
import { Card } from '@/components/ui/common';

const features = [
  {
    icon: '📤',
    title: 'Import any data',
    desc: 'Upload CSV, TSV, XLSX or XLS files in seconds. Your data is stored securely and scoped to your account.',
  },
  {
    icon: '📊',
    title: 'Auto visualization',
    desc: 'We detect numbers, dates and categories and render clean charts — line, bar and scatter — with zero configuration.',
  },
  {
    icon: '🧮',
    title: 'Calculate anything',
    desc: 'Summarise columns with built-in stats, or write your own formula like col_a * 2 + col_b to derive new columns instantly.',
  },
  {
    icon: '🔗',
    title: 'Data Sources',
    desc: 'All your imported datasets live in one place as reusable data sources you can revisit and re-analyse anytime.',
  },
  {
    icon: '🔒',
    title: 'Private & scoped',
    desc: 'Every dataset is tenant-scoped. Your data is isolated and only visible to you and the people you share it with.',
  },
  {
    icon: '⚡',
    title: 'Always online',
    desc: 'Hosted 24/7 on Vercel + Render with a Neon Postgres backend, so your dashboards are there whenever you need them.',
  },
];

const steps = [
  { n: 1, title: 'Create an account', desc: 'Sign up in seconds — no credit card, no setup.' },
  { n: 2, title: 'Upload your file', desc: 'Drag in a CSV or Excel file from your computer.' },
  { n: 3, title: 'Explore & calculate', desc: 'Visualize, filter and run formulas on your data.' },
];

export default function LandingPage() {
  const { isAuthenticated, hydrated } = useAuthStore();

  // If already logged in, send them to the app. Otherwise show the public site.
  useEffect(() => {
    if (hydrated && isAuthenticated) {
      window.location.href = '/dashboard';
    }
  }, [hydrated, isAuthenticated]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white grid place-items-center font-bold">D</div>
            <span className="text-xl font-bold">DataViz</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#how" className="hover:text-slate-900">How it works</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-slate-900">
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white dark:from-slate-800 dark:to-slate-900" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <span className="inline-block mb-4 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
            Turn raw files into insight
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900">
            Upload your data.<br />Understand it instantly.
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
            DataViz is a file-upload data visualization platform. Drop in a CSV or Excel
            file and get interactive charts, summaries and on-the-fly calculations —
            no spreadsheets required.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl shadow-sm"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="text-base font-semibold text-slate-700 bg-white border border-gray-300 hover:bg-gray-50 px-6 py-3 rounded-xl"
            >
              I already have an account
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            Free to use · Your data stays private and scoped to your account
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">What you can do</h2>
          <p className="mt-2 text-gray-600">Everything you need to go from a raw file to a clear answer.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="h-full">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-gray-50 dark:bg-slate-800/50 border-y border-gray-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How it works</h2>
            <p className="mt-2 text-gray-600">Three steps from file to insight.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-600 text-white grid place-items-center text-lg font-bold">
                  {s.n}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-bold">Ready to see your data clearly?</h2>
        <p className="mt-2 text-gray-600">Create a free account and upload your first file.</p>
        <Link
          href="/register"
          className="inline-block mt-6 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl"
        >
          Get started free
        </Link>
      </section>

      <footer className="border-t border-gray-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-gray-400 flex items-center justify-between">
          <span>© {new Date().getFullYear()} DataViz</span>
          <span>Built for file-first data analysis</span>
        </div>
      </footer>
    </div>
  );
}
