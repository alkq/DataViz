'use client';

import React from 'react';

/**
 * SideRays — animated light rays drifting along the sides (React Bits "Side Rays" style).
 */
export function SideRays({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div style={{ position: 'absolute', inset: 0 }}>
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '-20%',
              bottom: '-20%',
              left: `${i * 15 + 2}%`,
              width: '3px',
              background:
                'linear-gradient(to bottom, transparent, rgba(59,130,246,0.55), rgba(168,85,247,0.4), transparent)',
              filter: 'blur(1.5px)',
              animation: `ray-move ${7 + i * 0.6}s ease-in-out ${i * 0.5}s infinite`,
              opacity: 0.35,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes ray-move {
          0%   { transform: translateY(-25%); opacity: 0; }
          50%  { opacity: 0.55; }
          100% { transform: translateY(25%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default SideRays;
