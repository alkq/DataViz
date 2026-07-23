'use client';

import React, { useEffect, useRef } from 'react';

/**
 * BackgroundCollage — merges several images into a masked, blended backdrop.
 * Each image is positioned, softened with a radial mask and mix-blend-mode so
 * they melt into one another beneath the aurora/rays. Subtle parallax on scroll.
 */
const IMAGES = [
  { src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=70', pos: 'top-0 left-0 w-1/2 h-1/2', blend: 'overlay', mask: 'radial-gradient(circle at 30% 30%, #000 0%, transparent 70%)' },
  { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&q=70', pos: 'top-0 right-0 w-1/2 h-1/2', blend: 'soft-light', mask: 'radial-gradient(circle at 70% 30%, #000 0%, transparent 70%)' },
  { src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1400&q=70', pos: 'bottom-0 left-0 w-1/2 h-1/2', blend: 'overlay', mask: 'radial-gradient(circle at 30% 70%, #000 0%, transparent 70%)' },
  { src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1400&q=70', pos: 'bottom-0 right-0 w-1/2 h-1/2', blend: 'soft-light', mask: 'radial-gradient(circle at 70% 70%, #000 0%, transparent 70%)' },
  { src: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1400&q=70', pos: 'top-1/4 left-1/4 w-1/2 h-1/2', blend: 'overlay', mask: 'radial-gradient(circle at 50% 50%, #000 0%, transparent 75%)' },
];

export function BackgroundCollage({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const y = window.scrollY * 0.04;
      el.style.transform = `translateY(${y}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={ref} className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-900/70" />
      {IMAGES.map((img, i) => (
        <div
          key={i}
          className={`absolute ${img.pos}`}
          style={{ mixBlendMode: img.blend as any, WebkitMaskImage: img.mask, maskImage: img.mask }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.src}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover opacity-50 dark:opacity-40"
          />
        </div>
      ))}
    </div>
  );
}

export default BackgroundCollage;
