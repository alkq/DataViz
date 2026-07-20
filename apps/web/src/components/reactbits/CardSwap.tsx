'use client';

import React, { useEffect, useState } from 'react';

/**
 * CardSwap — auto-rotating stack of cards (React Bits "Card Swap" style).
 * Great for an "examples / showcase" strip on the landing page.
 */
export function CardSwap({
  cards,
  interval = 2600,
  className = '',
}: {
  cards: { title: string; desc: string; accent?: string }[];
  interval?: number;
  className?: string;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % cards.length), interval);
    return () => clearInterval(t);
  }, [cards.length, interval]);

  return (
    <div className={`relative h-44 ${className}`}>
      {cards.map((c, i) => {
        const offset = (i - active + cards.length) % cards.length;
        const isActive = offset === 0;
        return (
          <div
            key={c.title}
            className={`absolute inset-x-0 transition-all duration-500 ${
              isActive ? 'opacity-100 translate-y-0 z-30' : offset === 1 ? 'opacity-70 translate-y-4 z-20' : 'opacity-40 translate-y-8 z-10'
            }`}
            style={{ pointerEvents: isActive ? 'auto' : 'none' }}
          >
            <div className="rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.accent || '#3b82f6' }} />
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{c.title}</h3>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{c.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CardSwap;
