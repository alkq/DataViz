'use client';

import React from 'react';

/**
 * Dither — animated dithered gradient backdrop (React Bits "Dither" style).
 * Uses an SVG feTurbulence + animated gradient for a soft grainy gradient.
 */
export function Dither({
  className = '',
  color1 = '#0f172a',
  color2 = '#1e3a8a',
}: {
  className?: string;
  color1?: string;
  color2?: string;
}) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <svg className="h-full w-full" preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="dither-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color1} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
          <filter id="dither-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch">
              <animate attributeName="baseFrequency" dur="14s" values="0.9;0.7;0.9" repeatCount="indefinite" />
            </feTurbulence>
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.12" />
            </feComponentTransfer>
            <feComposite operator="in" in2="SourceGraphic" />
          </filter>
          <mask id="dither-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect width="100%" height="100%" filter="url(#dither-noise)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#dither-grad)" />
        <rect width="100%" height="100%" fill="url(#dither-grad)" mask="url(#dither-mask)" opacity="0.5" />
      </svg>
    </div>
  );
}

export default Dither;
