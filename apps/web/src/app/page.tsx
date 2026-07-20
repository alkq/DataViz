'use client';

import { Providers } from '@/components/Providers';
import { useAuthStore } from '@/lib/auth-store';
import { useEffect } from 'react';

export default function HomePage() {
  const { isAuthenticated, hydrated } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    window.location.href = isAuthenticated ? '/dashboard' : '/login';
  }, [hydrated, isAuthenticated]);

  return (
    <Providers>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    </Providers>
  );
}