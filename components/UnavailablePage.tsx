'use client'

import React, { useEffect, useState } from 'react'

const UnavailablePage = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: '#0a0a0f',
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255, 80, 60, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Decorative grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,80,60,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,80,60,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Corner brackets */}
      {[
        'top-6 left-6 border-t-2 border-l-2',
        'top-6 right-6 border-t-2 border-r-2',
        'bottom-6 left-6 border-b-2 border-l-2',
        'bottom-6 right-6 border-b-2 border-r-2',
      ].map((cls, i) => (
        <div
          key={i}
          className={`absolute w-8 h-8 ${cls}`}
          style={{ borderColor: 'rgba(255,80,60,0.4)' }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-20 flex flex-col items-center gap-6 px-6 text-center max-w-lg">

        {/* Status badge */}
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-sm text-xs tracking-widest uppercase"
          style={{
            background: 'rgba(255,80,60,0.1)',
            border: '1px solid rgba(255,80,60,0.3)',
            color: '#ff503c',
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{
              background: '#ff503c',
              boxShadow: '0 0 6px #ff503c',
              animation: 'pulse 1.2s ease-in-out infinite',
            }}
          />
          System Status
        </div>

        {/* Error code */}
        <div
          style={{
            fontSize: 'clamp(5rem, 18vw, 9rem)',
            fontWeight: 900,
            lineHeight: 1,
            color: 'transparent',
            WebkitTextStroke: '2px rgba(255,80,60,0.25)',
            letterSpacing: '-0.04em',
            userSelect: 'none',
          }}
        >
          503
        </div>

        {/* Heading */}
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-tight"
          style={{ color: '#f0ece4', letterSpacing: '-0.02em' }}
        >
          Service Unavailable
        </h1>

        {/* Divider */}
        <div
          className="w-16 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,80,60,0.5), transparent)' }}
        />

        {/* Message */}
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'rgba(240,236,228,0.45)', maxWidth: '26rem' }}
        >
          We're currently down for maintenance or experiencing an unexpected issue.
          Our team is already on it.
        </p>

        {/* Animated status line */}
        <div
          className="text-xs tracking-widest"
          style={{ color: 'rgba(255,80,60,0.6)', minWidth: '12ch' }}
        >
          Reconnecting{dots}
        </div>

        {/* CTA */}
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-6 py-2.5 text-xs tracking-widest uppercase transition-all duration-200"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,80,60,0.4)',
            color: 'rgba(255,80,60,0.8)',
            cursor: 'pointer',
            letterSpacing: '0.15em',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,80,60,0.12)';
            (e.currentTarget as HTMLButtonElement).style.color = '#ff503c';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,80,60,0.8)';
          }}
        >
          Try Again
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}

export default UnavailablePage