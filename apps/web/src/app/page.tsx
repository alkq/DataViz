'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Aurora } from '@/components/reactbits/Aurora';
import { SoftAurora } from '@/components/reactbits/SoftAurora';
import { SideRays } from '@/components/reactbits/SideRays';
import { ShinyText } from '@/components/reactbits/ShinyText';
import { SpotlightCard } from '@/components/reactbits/SpotlightCard';
import { DecryptedText } from '@/components/reactbits/DecryptedText';
import { ScrollReveal } from '@/components/reactbits/ScrollReveal';
import { TiltedCard } from '@/components/reactbits/TiltedCard';
import { CardSwap } from '@/components/reactbits/CardSwap';
import { AnimatedList } from '@/components/reactbits/AnimatedList';
import { CountUp } from '@/components/reactbits/CountUp';
import { Counter } from '@/components/reactbits/Counter';
import { BorderGlow } from '@/components/reactbits/BorderGlow';
import { ClickSpark } from '@/components/reactbits/ClickSpark';
import { BackgroundCollage } from '@/components/reactbits/BackgroundCollage';
import { BarCube, OrbitNode, DataCard } from '@/components/reactbits/Interactive3D';
import { Threads } from '@/components/reactbits/Threads';
import { Dither } from '@/components/reactbits/Dither';

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
  const { isAuthenticated } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white">Home</Link>
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white">Features</a>
            <a href="#how" className="hover:text-slate-900 dark:hover:text-white">How it works</a>
            <a href="#use" className="hover:text-slate-900 dark:hover:text-white">What it&apos;s for</a>
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Theme:</span>
              <select
                value={mounted ? theme : 'system'}
                onChange={(e) => setTheme(e.target.value)}
                className="text-sm border border-gray-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <Link href="/login" className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-slate-900 dark:hover:text-white">
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
            >
              Get started
            </Link>
            {/* Hamburger: Dashboard / Data Sources / Datasets */}
            <div className="relative md:hidden">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Open menu"
                className="p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-2 z-50">
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">Dashboard</Link>
                  <Link href="/sources" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">Data Sources</Link>
                  <Link href="/datasets" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">Datasets</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero with Aurora + SoftAurora + SideRays + Dither + Threads + masked image collage + interactive 3D */}
      <section className="relative overflow-hidden">
        <Dither className="opacity-60" />
        <BackgroundCollage />
        <Threads color="99,102,241" />
        <Aurora className="opacity-30 dark:opacity-50" />
        <SoftAurora className="opacity-70" />
        <SideRays />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center">
          {/* Floating interactive 3D elements */}
          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            <div className="pointer-events-auto absolute left-[6%] top-[18%]"><BarCube /></div>
            <div className="pointer-events-auto absolute right-[8%] top-[20%]"><OrbitNode /></div>
            <div className="pointer-events-auto absolute right-[12%] bottom-[14%]"><DataCard /></div>
          </div>
          <span className="inline-block mb-5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            File-first data analysis
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            <span className="text-slate-900 dark:text-white">
              <DecryptedText text="Upload your data." speed={45} />
            </span>
            <br />
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
            <ClickSpark>
              <BorderGlow className="rounded-xl" radius="0.75rem">
                <Link
                  href="/register"
                  className="inline-block text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl shadow-sm"
                >
                  Start for free
                </Link>
              </BorderGlow>
            </ClickSpark>
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

      {/* Trust / stats strip with CountUp */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { v: 50, suffix: 'K+', label: 'Files visualized' },
            { v: 12, suffix: 'M+', label: 'Rows analyzed' },
            { v: 99, suffix: '%', label: 'Uptime' },
            { v: 0, suffix: '$', label: 'Cost to start' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur px-5 py-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                <CountUp to={s.v} suffix={s.suffix} />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase: CardSwap + AnimatedList */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid md:grid-cols-2 gap-10 items-center">
        <ScrollReveal>
          <h2 className="text-3xl font-bold mb-3">See what your data becomes</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Upload once and watch a flat file turn into a clear, explorable view — examples of what members build:
          </p>
          <CardSwap
            cards={[
              { title: 'Monthly sales by region', desc: 'A bar chart of revenue split across 6 regions, sorted automatically.', accent: '#3b82f6' },
              { title: 'Support ticket trends', desc: 'A line chart of tickets over time with a 7-day moving average.', accent: '#a855f7' },
              { title: 'User engagement scatter', desc: 'Sessions vs. conversions, colored by plan tier.', accent: '#22d3ee' },
              { title: 'Inventory health', desc: 'Low-stock flags derived from a simple formula column.', accent: '#22c55e' },
            ]}
          />
        </ScrollReveal>
        <ScrollReveal delay={0.15}>
          <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
            <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Built-in data tools</h3>
            <AnimatedList
              items={[
                'Auto-detect column types (number, date, category)',
                'Line / bar / scatter charts, zero config',
                'Aggregate stats: sum, mean, min, max, median',
                'Derive columns with formulas like a * 2 + b',
                'Filter, sort and search your rows',
                'Revisit every file as a saved Data Source',
              ]}
            />
            <div className="mt-6 border-t border-gray-100 dark:border-slate-700 pt-5">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Member rating</p>
              <Counter initial={1240} step={1} />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* What it's for */}
      <section id="use" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ScrollReveal>
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
        </ScrollReveal>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 dark:bg-slate-800/40 border-y border-gray-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">What you can do</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Everything you need to go from a raw file to a clear answer.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={(i % 3) * 0.1}>
                <TiltedCard className="h-full" maxTilt={8}>
                  <SpotlightCard
                    className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 h-full group"
                  >
                    <div className="p-6">
                      <div className="text-3xl mb-3">{f.icon}</div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{f.title}</h3>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{f.desc}</p>
                    </div>
                  </SpotlightCard>
                </TiltedCard>
              </ScrollReveal>
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
