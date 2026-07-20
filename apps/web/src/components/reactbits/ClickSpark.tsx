'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * ClickSpark — emits a burst of sparks at the click point (React Bits "Click Spark" style).
 * Wrap any clickable area; sparks render via a canvas overlay.
 */
export function ClickSpark({
  children,
  className = '',
  color = '#3b82f6',
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparks = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);
  const raf = useRef(0);

  const spawn = (x: number, y: number) => {
    for (let i = 0; i < 9; i++) {
      const a = (Math.PI * 2 * i) / 9;
      sparks.current.push({ x, y, vx: Math.cos(a) * 2.4, vy: Math.sin(a) * 2.4, life: 1 });
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sparks.current = sparks.current.filter((s) => s.life > 0);
    for (const s of sparks.current) {
      ctx.globalAlpha = s.life;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.06;
      s.life -= 0.03;
    }
    ctx.globalAlpha = 1;
    raf.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = ref.current?.getBoundingClientRect();
      canvas.width = rect?.width || 300;
      canvas.height = rect?.height || 120;
    }
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      onClick={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (rect) spawn(e.clientX - rect.left, e.clientY - rect.top);
      }}
    >
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-50" />
      {children}
    </div>
  );
}

export default ClickSpark;
