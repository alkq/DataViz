'use client';

import React from 'react';

/**
 * SoftAurora — softer, slower aurora drift (React Bits "Soft Aurora" style).
 */
export function SoftAurora({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {[
        { top: '10%', left: '15%', size: '40vw', c: 'rgba(59,130,246,0.30)', d: '18s' },
        { top: '30%', left: '55%', size: '45vw', c: 'rgba(168,85,247,0.26)', d: '22s' },
        { top: '55%', left: '30%', size: '38vw', c: 'rgba(34,211,238,0.22)', d: '26s' },
      ].map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            background: `radial-gradient(circle at center, ${b.c}, transparent 70%)`,
            filter: 'blur(60px)',
            animation: `soft-aurora-move ${b.d} ease-in-out infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes soft-aurora-move {
          0%   { transform: translate(0,0) scale(1); }
          50%  { transform: translate(6%, -4%) scale(1.12); }
          100% { transform: translate(-5%, 5%) scale(0.95); }
        }
      `}</style>
    </div>
  );
}

export default SoftAurora;
