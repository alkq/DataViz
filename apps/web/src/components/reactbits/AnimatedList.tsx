'use client';

import React, { useState } from 'react';

/**
 * AnimatedList — staggered list entrance with hover highlight (React Bits "Animated List" style).
 */
export function AnimatedList({
  items,
  className = '',
  onItemSelect,
}: {
  items: string[];
  className?: string;
  onItemSelect?: (item: string, index: number) => void;
}) {
  const [active, setActive] = useState<number | null>(null);
  return (
    <ul className={`space-y-1 ${className}`}>
      {items.map((item, i) => (
        <li
          key={item}
          onMouseEnter={() => setActive(i)}
          onMouseLeave={() => setActive(null)}
          onClick={() => onItemSelect?.(item, i)}
          className={`list-item-anim cursor-pointer rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-200 transition-colors ${
            active === i ? 'bg-blue-50 dark:bg-slate-700' : 'hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
          style={{ animationDelay: `${i * 70}ms` }}
        >
          {item}
        </li>
      ))}
      <style>{`
        .list-item-anim {
          opacity: 0;
          animation: list-fade-in 0.45s ease forwards;
        }
        @keyframes list-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ul>
  );
}

export default AnimatedList;
