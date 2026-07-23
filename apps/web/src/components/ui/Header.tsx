'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useTheme } from 'next-themes';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!isAuthenticated) return null;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white grid place-items-center font-bold">D</div>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">DataViz</span>
            </Link>
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6 ml-5">
              <Link href="/" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-slate-900 dark:hover:text-white">Home</Link>
              <Link href="/dashboard" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-slate-900 dark:hover:text-white">Dashboard</Link>
              <Link href="/sources" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-slate-900 dark:hover:text-white">Data Sources</Link>
              <Link href="/datasets" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-slate-900 dark:hover:text-white">Datasets</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme selector: hidden on very small screens (in hamburger) */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Theme:</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="text-sm border border-gray-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            {/* Desktop user info */}
            <div className="hidden md:flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
              <span className="font-medium max-w-[160px] truncate">{user?.email}</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">{user?.role}</span>
              <button onClick={logout} className="text-red-600 hover:text-red-800 font-medium">Logout</button>
            </div>

            {/* Mobile hamburger */}
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
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-2 z-50">
                  <Link href="/" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">Home</Link>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">Dashboard</Link>
                  <Link href="/sources" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">Data Sources</Link>
                  <Link href="/datasets" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">Datasets</Link>
                  <div className="border-t border-gray-100 dark:border-slate-700 my-1" />
                  <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</div>
                  <button onClick={() => { setMenuOpen(false); logout(); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-slate-700">Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
