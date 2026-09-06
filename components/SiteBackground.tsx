'use client';

import { useEffect, useRef } from 'react';

/**
 * Site-wide background canvas: radial wash + static cyber grid +
 * static glow orbs + a zero-overhead GPU cursor spotlight.
 *
 * Mounted from app/layout.tsx behind the `showAnimatedBackground` feature flag.
 *
 * Performance architecture:
 * 1. Zero continuous background animations: the cyber grid rests static so the
 *    browser's GPU caches the canvas layer once. Descendant glass surfaces
 *    (backdrop-filter: blur) cache their blurred textures and scroll at a locked
 *    60fps with zero re-blur penalty.
 * 2. GPU-driven cursor spotlight: moves via transform: translate3d in a direct DOM
 *    rAF loop. No React re-renders and no software radial-gradient repaints.
 * 3. Unified canvas layer: the canvas root holds a single compositing layer so all
 *    glow orbs and washes composite into one static texture behind glass panels.
 */
export default function SiteBackground() {
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // The spotlight is desktop-only: on touch/coarse-pointer devices, hide it completely.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const spotlight = spotlightRef.current;
    if (!spotlight) return;

    let frame = 0;
    let clientX = window.innerWidth * 0.5;
    let clientY = window.innerHeight * 0.3;

    const update = () => {
      frame = 0;
      if (spotlight) {
        spotlight.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -50%)`;
        spotlight.style.opacity = '1';
      }
    };

    const onMove = (e: MouseEvent) => {
      clientX = e.clientX;
      clientY = e.clientY;
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      id="animated-background-canvas"
      className="pointer-events-none fixed inset-x-0 -top-16 h-[calc(100svh+204px)] -z-10 overflow-hidden bg-[#f8fafc] dark:bg-[#05060f] transform-gpu [backface-visibility:hidden] [transform:translateZ(0)]"
    >
      {/* Base radial wash (light & dark) */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,rgba(168,85,247,0.18),transparent_60%)] dark:bg-[radial-gradient(120%_90%_at_50%_-10%,rgba(124,58,237,0.3),transparent_55%)]" />

      {/* Cyber-matrix grid: static GPU layer with radial vignette mask.
          Kept static so backdrop-filter panels sampling this canvas never re-blur on idle frames. */}
      <div
        className="absolute inset-0 overflow-hidden opacity-[0.25] dark:opacity-[0.18]"
        style={{
          maskImage: 'radial-gradient(110% 80% at 50% 0%, black 30%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(110% 80% at 50% 0%, black 30%, transparent 78%)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      {/* Ambient glow orbs — blur-[100px] on mobile for fast GPU rastering,
          full blur from sm up. Static, zero animation overhead. */}
      <div id="bg-orb-purple" className="absolute -top-32 -left-24 h-[36rem] w-[36rem] rounded-full bg-[#8b5cf6]/24 dark:bg-[#8b5cf6]/30 blur-[100px] sm:blur-[130px] [backface-visibility:hidden]" />
      {/* Parked behind the nav/dropdown zone so the glass there has color to frost */}
      <div id="bg-orb-blue" className="absolute -top-24 right-[12%] h-[26rem] w-[26rem] rounded-full bg-[#60a5fa]/15 dark:bg-[#60a5fa]/20 blur-[100px] sm:blur-[120px] [backface-visibility:hidden]" />
      <div id="bg-orb-pink" className="absolute top-1/3 -right-28 h-[32rem] w-[32rem] rounded-full bg-[#e64bd6]/22 dark:bg-[#e64bd6]/25 blur-[100px] sm:blur-[130px] [backface-visibility:hidden]" />
      <div id="bg-orb-teal" className="absolute bottom-0 left-1/4 h-[28rem] w-[28rem] rounded-full bg-[#2dd4bf]/20 dark:bg-[#2dd4bf]/20 blur-[100px] sm:blur-[130px] [backface-visibility:hidden]" />

      {/* Cursor spotlight — GPU transform-only, zero React re-renders, zero full-viewport gradient repaints */}
      <div
        ref={spotlightRef}
        id="cursor-spotlight"
        className="pointer-events-none absolute top-0 left-0 h-[460px] w-[460px] rounded-full opacity-0 will-change-transform transition-opacity duration-500"
        style={{
          background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 60%)',
          transform: 'translate3d(50vw, 30vh, 0) translate(-50%, -50%)',
        }}
      />
    </div>
  );
}
