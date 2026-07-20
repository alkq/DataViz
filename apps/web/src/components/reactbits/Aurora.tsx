'use client';

import React from 'react';

/**
 * Aurora — animated gradient "aurora" background (React Bits style).
 * Pure CSS keyframe animation, no external deps. Place behind content.
 */
export function Aurora({
  colorStops = ['#22d3ee', '#3b82f6', '#a855f7', '#22d3ee'],
  speed = 12,
  blend = 0.4,
  className = '',
}: {
  colorStops?: string[];
  speed?: number;
  blend?: number;
  className?: string;
}) {
  const blobs = colorStops.slice(0, 4);
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ filter: `blur(60px)`, opacity: blend }}
      aria-hidden
    >
      <div className="aurora-anim" style={{ position: 'absolute', inset: '-30%', display: 'flex' }}>
        {blobs.map((c, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: `radial-gradient(circle at 50% 50%, ${c} 0%, transparent 60%)`,
              animation: `aurora-shift ${speed + i * 3}s ease-in-out ${i * 1.5}s infinite alternate`,
              transform: `translateY(${i % 2 ? '-10%' : '10%'})`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes aurora-shift {
          0%   { transform: translate3d(-10%, -5%, 0) scale(1.1) rotate(0deg); }
          50%  { transform: translate3d(8%, 6%, 0) scale(1.3) rotate(8deg); }
          100% { transform: translate3d(-6%, 10%, 0) scale(1.15) rotate(-6deg); }
        }
      `}</style>
    </div>
  );
}

export default Aurora;
