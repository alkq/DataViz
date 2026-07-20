'use client';

import React from 'react';

/**
 * SpecularButton — button with a moving specular sheen on hover
 * (React Bits "Specular Button" style).
 */
export function SpecularButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      {...props}
      className={`relative overflow-hidden rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 shadow-sm specular-btn ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <span
        className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(120px circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.45), transparent 60%)',
        }}
        onMouseMove={(e) => {
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          (e.currentTarget as HTMLElement).style.setProperty('--mx', `${e.clientX - r.left}px`);
          (e.currentTarget as HTMLElement).style.setProperty('--my', `${e.clientY - r.top}px`);
        }}
      />
    </button>
  );
}

export default SpecularButton;
