'use client';

import React, { useEffect, useState } from 'react';

/**
 * Counter — incrementing counter with +/- controls and a "stars" flavor (React Bits "Counter" style).
 */
export function Counter({
  initial = 0,
  step = 1,
  className = '',
}: {
  initial?: number;
  step?: number;
  className?: string;
}) {
  const [count, setCount] = useState(initial);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStars((s) => (s % 5) + 1), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCount((c) => c - step)}
          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-600"
          aria-label="decrement"
        >
          −
        </button>
        <span className="w-12 text-center text-lg font-semibold text-slate-900 dark:text-slate-100">{count}</span>
        <button
          onClick={() => setCount((c) => c + step)}
          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-600"
          aria-label="increment"
        >
          +
        </button>
      </div>
      <span className="text-yellow-400 tracking-widest" aria-hidden>
        {'★'.repeat(stars)}
        {'☆'.repeat(5 - stars)}
      </span>
    </div>
  );
}

export default Counter;
