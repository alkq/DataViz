'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * DecryptedText — characters scramble then resolve to the final text
 * (React Bits "Decrypted Text" style). Plays once on mount.
 */
export function DecryptedText({
  text,
  speed = 40,
  className = '',
  as: Tag = 'span',
}: {
  text: string;
  speed?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}) {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
  const [output, setOutput] = useState(text.split('').map(() => CHARS[0]).join(''));
  const frame = useRef(0);

  useEffect(() => {
    const queue = text.split('').map((char, i) => ({
      char,
      revealed: i < Math.floor(text.length * 0.35),
    }));
    let raf = 0;
    const tick = () => {
      frame.current += 1;
      let done = true;
      const next = queue
        .map((q, i) => {
          if (q.revealed || q.char === ' ') {
            return q.char;
          }
          if (frame.current > i * 2) {
            queue[i].revealed = true;
            return q.char;
          }
          done = false;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join('');
      setOutput(next);
      if (!done) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const Comp = Tag as any;
  return <Comp className={className}>{output}</Comp>;
}

export default DecryptedText;
