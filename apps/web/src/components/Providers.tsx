'use client';

import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  // TEMP DEBUG: bypass SessionProvider/ThemeProvider to test hydration
  return <>{children}</>;
}
