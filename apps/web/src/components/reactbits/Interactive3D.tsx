'use client';

import React, { useRef, useState } from 'react';

/**
 * Interactive3D — floating 3D shapes the user can drag/tilt and click.
 * Pure CSS 3D (perspective + pointer tracking), no WebGL dependency.
 *  - BarCube: a stack of bars that tilts toward the cursor.
 *  - OrbitNode: a sphere with orbiting dots; click spins it.
 *  - DataCard: a tilted glass card that follows the pointer.
 */
function useTilt(max = 18) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${px * max}deg) rotateX(${-py * max}deg)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = 'rotateY(0deg) rotateX(0deg)';
  };
  return { ref, onMove, reset };
}

export function BarCube({ className = '' }: { className?: string }) {
  const { ref, onMove, reset } = useTilt(22);
  const bars = [40, 70, 55, 90, 65];
  return (
    <div
      className={`relative ${className}`}
      style={{ perspective: '700px' }}
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      <div
        ref={ref}
        className="relative transition-transform duration-150"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="flex items-end gap-1.5 h-20" style={{ transform: 'translateZ(20px)' }}>
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-3 rounded-t bg-gradient-to-t from-blue-600 to-cyan-400"
              style={{ height: `${h}px`, transform: `translateZ(${i * 6}px)` }}
            />
          ))}
        </div>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-3 rounded-full bg-blue-500/30 blur-md" />
      </div>
    </div>
  );
}

export function OrbitNode({ className = '' }: { className?: string }) {
  const [spin, setSpin] = useState(false);
  return (
    <div
      className={`relative ${className}`}
      style={{ perspective: '700px' }}
      onClick={() => setSpin((s) => !s)}
      title="Click to spin"
    >
      <div
        className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 grid place-items-center"
        style={{
          transformStyle: 'preserve-3d',
          animation: spin ? 'node-spin 3s linear infinite' : undefined,
          boxShadow: '0 0 24px rgba(99,102,241,0.6)',
        }}
      >
        <span className="text-white text-xs font-bold">DV</span>
        {[...Array(4)].map((_, i) => (
          <span
            key={i}
            className="absolute w-2.5 h-2.5 rounded-full bg-cyan-300"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${i * 90}deg) translateX(34px) translateY(-50%)`,
              boxShadow: '0 0 8px rgba(34,211,238,0.8)',
            }}
          />
        ))}
      </div>
      <style>{`@keyframes node-spin { to { transform: rotateY(360deg) rotateX(360deg); } }`}</style>
    </div>
  );
}

export function DataCard({ className = '' }: { className?: string }) {
  const { ref, onMove, reset } = useTilt(14);
  return (
    <div className={`relative ${className}`} style={{ perspective: '800px' }} onMouseMove={onMove} onMouseLeave={reset}>
      <div
        ref={ref}
        className="relative transition-transform duration-150 w-40 rounded-xl border border-white/20 bg-white/10 backdrop-blur p-3 text-white"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="text-[10px] uppercase tracking-widest text-white/60">Revenue</div>
        <div className="text-lg font-bold" style={{ transform: 'translateZ(18px)' }}>$48.2K</div>
        <div className="mt-1 h-1.5 w-full rounded bg-white/20 overflow-hidden">
          <div className="h-full w-2/3 bg-cyan-400" />
        </div>
        <div className="mt-2 flex gap-1">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="w-1.5 rounded bg-cyan-300/70" style={{ height: `${8 + (i * 5) % 20}px` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default { BarCube, OrbitNode, DataCard };
