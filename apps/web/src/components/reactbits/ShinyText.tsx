'use client';

import React from 'react';

/**
 * ShinyText — text with a moving shine/specular highlight (React Bits "Shiny Text" style).
 */
export function ShinyText({
  text,
  disabled = false,
  speed = 3,
  className = '',
}: {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}) {
  const animationDuration = `${speed}s`;
  return (
    <span
      className={`shiny-text ${disabled ? 'shiny-disabled' : ''} ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(120deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0) 60%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: `shiny-sweep ${animationDuration} linear infinite`,
        display: 'inline-block',
      }}
    >
      {text}
      <style>{`
        @keyframes shiny-sweep {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </span>
  );
}

export default ShinyText;
