'use client';

import { useEffect, useState } from 'react';

/* Keyframes + media rules for the background canvas. Server-rendered as a
   plain <style> tag (NOT styled-jsx, which would only inject these at
   hydration — the grid/orbs would sit frozen and the touch-device spotlight
   would briefly show). */
const GLM_BACKGROUND_CSS = `
@keyframes gridmove {
  from { transform: translateY(0); }
  to { transform: translateY(-560px); }
}
/* The spotlight is pointless on touch devices — it only ever reacts
   to emulated tap-mousemoves and is barely visible on small screens —
   so drop it there completely. Desktop (hover + fine pointer) keeps
   it, byte-identical to before. */
@media (hover: none), (pointer: coarse) {
  #glm-cursor-spotlight { display: none; }
}
/* Respect reduced-motion: freeze the grid (the cursor
   spotlight already only reacts to pointer movement). The grid tile
   layer is a grandchild now, hence the second selector. */
@media (prefers-reduced-motion: reduce) {
  #animated-background-canvas > div,
  #animated-background-canvas > div > div {
    animation: none !important;
  }
}
`;

export default function GlmBackground() {
  const [pos, setPos] = useState({ x: 50, y: 30 });

  useEffect(() => {
    // The spotlight is desktop-only: on touch/coarse-pointer devices taps
    // fire emulated mousemove events but the glow is barely visible on a
    // phone, so never bind the listener there (no state churn, no repaints).
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    // rAF-coalesced: mousemove can fire several times per frame, and each
    // setPos re-renders this canvas and repaints a full-viewport gradient.
    // Collapsing to one update per frame is visually identical.
    let frame = 0;
    let next = { x: 50, y: 30 };
    const flush = () => {
      frame = 0;
      setPos(next);
    };
    const onMove = (e: MouseEvent) => {
      next = {
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      };
      if (!frame) frame = window.requestAnimationFrame(flush);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div id="animated-background-canvas" className="pointer-events-none fixed inset-x-0 -top-16 bottom-[-140px] -z-10 overflow-hidden bg-[#f8fafc] dark:bg-[#05060f]">
      {/* Base radial wash (Light & Dark) */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,rgba(168,85,247,0.18),transparent_60%)] dark:bg-[radial-gradient(120%_90%_at_50%_-10%,rgba(124,58,237,0.3),transparent_55%)]" />

      {/* Animated cyber-matrix grid. The mask + opacity live on this STATIC
          wrapper and only the tile layer inside it moves. Animating
          `background-position` (the previous approach) is a paint-only
          property: it repainted this full-viewport, masked layer every single
          frame, forever — and because this canvas is the backdrop that every
          glass panel on the page samples, that repaint invalidated and forced
          a re-blur of all ~100 backdrop-filter elements on every frame, even
          while the page sat idle. A transform on the inner layer is handled by
          the compositor instead, with no repaint. -560px is exactly 10 × the
          56px tile, so the loop is pixel-identical to the old one. */}
      <div
        className="absolute inset-0 overflow-hidden opacity-[0.25] dark:opacity-[0.18]"
        style={{
          maskImage: 'radial-gradient(110% 80% at 50% 0%, black 30%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(110% 80% at 50% 0%, black 30%, transparent 78%)',
        }}
      >
        {/* Extends 560px past the bottom so the upward travel never uncovers
            the wrapper. */}
        <div
          className="absolute inset-x-0 top-0 bottom-[-560px] [animation:gridmove_60s_linear_infinite] [will-change:transform]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      {/* Ambient glowing orbs (Light & Dark) — blur-[100px] on mobile for fast GPU rastering,
          restoring full blur on larger screens. Kept static with zero animation overhead. */}
      <div id="bg-orb-purple" className="absolute -top-32 -left-24 h-[36rem] w-[36rem] rounded-full bg-[#8b5cf6]/24 dark:bg-[#8b5cf6]/30 blur-[100px] sm:blur-[130px]" />
      {/* Blue orb parked behind the nav/dropdown zone so the glass there has color to frost */}
      <div id="bg-orb-blue" className="absolute -top-24 right-[12%] h-[26rem] w-[26rem] rounded-full bg-[#60a5fa]/15 dark:bg-[#60a5fa]/20 blur-[100px] sm:blur-[120px]" />
      <div id="bg-orb-pink" className="absolute top-1/3 -right-28 h-[32rem] w-[32rem] rounded-full bg-[#e64bd6]/22 dark:bg-[#e64bd6]/25 blur-[100px] sm:blur-[130px]" />
      <div id="bg-orb-teal" className="absolute bottom-0 left-1/4 h-[28rem] w-[28rem] rounded-full bg-[#2dd4bf]/20 dark:bg-[#2dd4bf]/20 blur-[100px] sm:blur-[130px]" />

      {/* Cursor spotlight — desktop-only; hidden on touch devices below */}
      <div
        id="glm-cursor-spotlight"
        className="absolute inset-0 transition-[background] duration-300"
        style={{
          background: `radial-gradient(460px circle at ${pos.x}% ${pos.y}%, rgba(168,85,247,0.12), transparent 60%)`,
        }}
      />

      {/* Keyframe animations — both are transform-only on purpose so the
          compositor can run them without repainting this canvas (see the grid
          and orb comments above for why that matters here specifically). */}
      <style>{GLM_BACKGROUND_CSS}</style>
    </div>
  );
}
