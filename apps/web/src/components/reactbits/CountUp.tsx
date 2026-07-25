'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * CountUp — animates a number to `to` whenever the value changes (and once when
 * it scrolls into view). Unlike the original one-shot version, it re-animates on
 * `to` changes so it stays correct when data arrives after mount (e.g. SWR fetch
 * resolves after the component already rendered with `to=0`).
 */
export function CountUp({
  to,
  duration = 1600,
  prefix = '',
  suffix = '',
  className = '',
}: {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const valRef = useRef(0);
  const seen = useRef(false);
  const rafRef = useRef<number | null>(null);

  const animateTo = (target: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = valRef.current;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(from + (target - from) * eased);
      valRef.current = v;
      setVal(v);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // Mark as seen when scrolled into view; trigger first animation then.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            seen.current = true;
            animateTo(to);
          }
        });
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-animate whenever `to` changes; if already visible, animate immediately,
  // otherwise it will animate on first intersection (above).
  useEffect(() => {
    if (seen.current) animateTo(to);
    else valRef.current = to; // will animate from correct base once seen
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

export default CountUp;
