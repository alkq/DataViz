'use client';

import { useEffect } from 'react';
import { warmUpApi } from '@/lib/keepalive';

// Mounted once at the app root. Pings /health on load so the
// Render free-tier API is awake before the user interacts (kills cold-start).
export function ApiWarmer() {
  useEffect(() => {
    warmUpApi();
  }, []);
  return null;
}
