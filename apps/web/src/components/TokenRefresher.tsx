'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';

const REFRESH_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Silently refreshes the JWT before it expires so returning users don't lose
 * their session (and their datasets) after the 1h window. Also surfaces a
 * non-blocking banner if a refresh ever fails, instead of silently booting.
 */
export function TokenRefresher() {
  const [expired, setExpired] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);

  const doRefresh = async () => {
    const { accessToken, refreshToken, expiresAt, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !accessToken || inFlight.current) return;
    // Refresh when within 5 minutes of expiry (or already past it).
    const soon = expiresAt ? expiresAt - Date.now() < 5 * 60 * 1000 : false;
    if (!soon && expiresAt) return;
    inFlight.current = true;
    try {
      const res = await fetch(`${REFRESH_URL}/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('refresh failed');
      const data = await res.json();
      if (data.accessToken) {
        refreshToken(data.accessToken);
        setExpired(false);
      } else {
        throw new Error('no token');
      }
    } catch {
      setExpired(true);
    } finally {
      inFlight.current = false;
    }
  };

  useEffect(() => {
    const schedule = () => {
      const { expiresAt, isAuthenticated } = useAuthStore.getState();
      if (timer.current) clearTimeout(timer.current);
      if (!isAuthenticated || !expiresAt) return;
      const ms = Math.max(0, expiresAt - Date.now() - 5 * 60 * 1000);
      timer.current = setTimeout(doRefresh, ms);
    };

    schedule();
    const unsub = useAuthStore.subscribe(schedule);
    const onFocus = () => doRefresh();
    window.addEventListener('focus', onFocus);
    const interval = setInterval(doRefresh, 4 * 60 * 1000); // safety net every 4 min

    return () => {
      if (timer.current) clearTimeout(timer.current);
      unsub();
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!expired) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-md rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/40 dark:border-amber-700 px-4 py-3 text-sm text-amber-900 dark:text-amber-100 shadow-lg">
      <p className="font-medium">Session expired</p>
      <p className="text-xs mt-0.5 opacity-90">
        Your session could not be renewed. Please{' '}
        <a href="/login" className="underline font-semibold">sign in again</a> to keep your data available.
      </p>
    </div>
  );
}
