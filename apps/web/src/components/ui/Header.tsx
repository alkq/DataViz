'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useTheme } from 'next-themes';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();

  if (!isAuthenticated) return null;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white grid place-items-center font-bold">D</div>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">DataViz</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-slate-900 dark:hover:text-white">
                Home
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-slate-900 dark:hover:text-white">
                Dashboard
              </Link>
              <Link href="/sources" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-slate-900 dark:hover:text-white">
                Data Sources
              </Link>
              <Link href="/datasets" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-slate-900 dark:hover:text-white">
                Datasets
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Theme:</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <span className="font-medium">{user?.email}</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {user?.role}
              </span>
              <button
                onClick={logout}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
