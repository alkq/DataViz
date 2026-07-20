'use client';

import React from 'react';

/**
 * Beams — animated light beams background (React Bits "Beams" style).
 * Pure CSS conic/skewed gradients drifting. Place behind auth content.
 */
export function Beams({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden>
      <div className="beams-anim" style={{ position: 'absolute', inset: 0 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '-20%',
              left: `${10 + i * 20}%`,
              width: '12%',
              height: '140%',
              background: 'linear-gradient(to bottom, rgba(59,130,246,0) 0%, rgba(59,130,246,0.25) 45%, rgba(168,85,247,0.25) 55%, rgba(59,130,246,0) 100%)',
              filter: 'blur(8px)',
              transform: `rotate(${18 + i * 2}deg)`,
              animation: `beam-drift ${10 + i * 2}s ease-in-out ${i * 1.5}s infinite alternate`,
              opacity: 0.5,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes beam-drift {
          0%   { transform: translateY(-8%) rotate(16deg); opacity: 0.35; }
          100% { transform: translateY(8%) rotate(22deg); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

export default Beams;
