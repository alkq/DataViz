'use client';

import React from 'react';

/**
 * BorderGlow — animated rotating gradient border glow (React Bits "Border Glow" style).
 */
export function BorderGlow({
  children,
  className = '',
  color = 'rgba(59,130,246,0.7)',
  radius = '1rem',
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  radius?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ borderRadius: radius, padding: '1.5px' }}>
      <div
        className="border-glow-rot"
        style={{
          position: 'absolute',
          inset: '-150%',
          background: `conic-gradient(from 0deg, transparent 0deg, ${color} 70deg, transparent 140deg, transparent 360deg)`,
          animation: 'border-spin 4.5s linear infinite',
        }}
      />
      <div className="relative h-full w-full" style={{ borderRadius: radius, background: 'inherit' }}>
        {children}
      </div>
      <style>{`
        @keyframes border-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default BorderGlow;
