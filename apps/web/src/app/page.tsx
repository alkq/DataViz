'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useEffect } from 'react';
import { Aurora } from '@/components/reactbits/Aurora';
import { ShinyText } from '@/components/reactbits/ShinyText';
import { SpotlightCard } from '@/components/reactbits/SpotlightCard';

const features = [
  {
    icon: '📤',
    title: 'Import any file',
    desc: 'Upload CSV, TSV, XLSX or XLS in seconds. Your data is stored securely and scoped to your account — no pipelines, no setup.',
  },
  {
    icon: '📊',
    title: 'Auto visualization',
    desc: 'We detect numbers, dates and categories and draw clean interactive charts — line, bar and scatter — with zero configuration.',
  },
  {
    icon: '🧮',
    title: 'Calculate anything',
    desc: 'Summarise columns with built-in stats, or write your own formula like col_a * 2 + col_b to derive new columns instantly.',
  },
  {
    icon: '🔗',
    title: 'Reusable Data Sources',
    desc: 'Every file you import becomes a saved data source you can revisit, filter and re-analyse whenever you need it.',
  },
  {
    icon: '🔒',
    title: 'Private & scoped',
    desc: 'Each dataset is tenant-scoped. Your data is isolated and only visible to you and the people you share it with.',
  },
  {
    icon: '⚡',
    title: 'Always online',
    desc: 'Hosted 24/7 on Vercel + Render with a Neon Postgres backend, so your dashboards are there whenever you open them.',
  },
];

const steps = [
  { n: 1, title: 'Create a free account', desc: 'Sign up in seconds — no credit card, no configuration.' },
  { n: 2, title: 'Upload your file', desc: 'Drag in a CSV or Excel file straight from your computer.' },
  { n: 3, title: 'Explore & calculate', desc: 'Visualize, filter and run formulas on your data in the browser.' },
];

export default function LandingPage() {
  const { isAuthenticated, hydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      window.location.href = '/dashboard';
    }
  }, [hydrated, isAuthenticated]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur border-b border-gray-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white grid place-items-center font-bold">D</div>
            <span className="text-xl font-bold">DataViz</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white">Features</a>
            <a href="#how" className="hover:text-slate-900 dark:hover:text-white">How it works</a>
            <a href="#use" className="hover:text-slate-900 dark:hover:text-white">What it's for</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-slate-900 dark:hover:text-white">
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

      {/* Hero with Aurora background */}
      <section className="relative overflow-hidden">
        <Aurora className="opacity-30 dark:opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center">
          <span className="inline-block mb-5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            File-first data analysis
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            Upload your data.<br />
            <span className="text-blue-600 dark:text-blue-400">
              <ShinyText text="Understand it instantly." speed={4} />
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
            DataViz is a file-upload data visualization platform. Drop in a CSV or Excel
            file and get interactive charts, summaries and on-the-fly calculations — no
            spreadsheets, no code, no setup.
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
              className="text-base font-semibold text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 px-6 py-3 rounded-xl"
            >
              I already have an account
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">
            Free to use · Your data stays private and scoped to your account
          </p>
        </div>
      </section>

      {/* What it's for */}
      <section id="use" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">What is DataViz for?</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Built for anyone who has data in a file and needs answers fast — analysts,
            founders, students, and operations teams who don&apos;t want to fight a
            spreadsheet.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { t: 'Turn raw files into insight', d: 'Open a CSV from a download or export and see trends, totals and outliers in seconds.' },
            { t: 'Share a live view', d: 'Your imported datasets live as saved sources you can reopen and re-analyse any time.' },
            { t: 'Do the math without Excel', d: 'Derive new columns with simple formulas and get aggregate stats on every numeric field.' },
          ].map((u) => (
            <div key={u.t} className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{u.t}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{u.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 dark:bg-slate-800/40 border-y border-gray-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">What you can do</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Everything you need to go from a raw file to a clear answer.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <SpotlightCard
                key={f.title}
                className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 h-full group"
              >
                <div className="p-6">
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{f.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{f.desc}</p>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">How it works</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Three steps from file to insight.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-600 text-white grid place-items-center text-lg font-bold">
                {s.n}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-bold">Ready to see your data clearly?</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Create a free account and upload your first file.</p>
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
