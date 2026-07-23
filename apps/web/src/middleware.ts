import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NOTE: A strict CSP with 'strict-dynamic' + nonce BLOCKS Next.js App Router's
// hydration scripts (they don't carry the nonce), which silently kills client
// interactivity in production. We set only non-blocking security headers here
// and rely on Next.js's own defaults. Add a proper nonce-aware CSP later if needed.
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const API = process.env.NEXT_PUBLIC_API_URL || 'https://dataviz-api.onrender.com';
  const apiOrigin = API.replace(/\/api\/v1$/, '');

  const cspHeader = [
    "default-src 'self'",
    // Allow Next.js inline + bundled scripts (no nonce/strict-dynamic, which breaks hydration)
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://images.unsplash.com",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' ${apiOrigin} https://vercel.live wss://localhost:*`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'block-all-mixed-content',
    'upgrade-insecure-requests',
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
