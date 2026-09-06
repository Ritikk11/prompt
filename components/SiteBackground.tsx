'use client';

import { useEffect, useState } from 'react';

/**
 * Site-wide animated background canvas: radial wash + drifting cyber grid +
 * static glow orbs + a desktop-only cursor spotlight.
 *
 * Mounted from app/layout.tsx behind the `showAnimatedBackground` feature flag,
 * so it can be switched off from admin without a deploy. It has to be its own
 * client component (the spotlight needs a mousemove listener) rather than
 * inlining into the server-rendered layout.
 *
 * Its keyframes and media rules live in app/globals.css — NOT in a <style> tag
 * here — so they arrive in the render-blocking stylesheet and hold from the
 * first paint. See the "Animated background canvas" block there.
 */
export default function SiteBackground() {
  const [pos, setPos] = useState({ x: 50, y: 30 });

  useEffect(() => {
    // The spotlight is desktop-only: on touch/coarse-pointer devices taps fire
    // emulated mousemove events but the glow is barely visible on a phone, so
    // never bind the listener there (no state churn, no repaints).
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
    /* Height is pinned to 100svh (+ the 64px top and 140px bottom overscan)
       instead of being anchored `bottom: -140px`. Anchoring made the canvas
       height track the DYNAMIC viewport: on Android the URL bar hides when you
       scroll down and reappears when you scroll up, resizing the viewport by
       ~56px each way. Every percentage-based child then re-resolved against the
       new height — the radial wash (`120% 90% at 50% -10%`) re-scaled and the
       `top-1/3` / `bottom-0` orbs slid — which is the colour/position shift
       that only ever appeared on a real phone (desktop and devtools emulation
       have no dynamic URL bar). `svh` is the SMALL viewport height: it stays
       constant through URL-bar show/hide, and it equals today's URL-bar-visible
       size, so the settled look is unchanged while the shift is gone. The
       bottom overscan (140px) still covers the extra area the viewport gains
       when the bar retracts. */
    <div id="animated-background-canvas" className="pointer-events-none fixed inset-x-0 -top-16 h-[calc(100svh+204px)] -z-10 overflow-hidden bg-[#f8fafc] dark:bg-[#05060f] transform-gpu [backface-visibility:hidden] [transform:translateZ(0)]">
      {/* Base radial wash (light & dark) */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,rgba(168,85,247,0.18),transparent_60%)] dark:bg-[radial-gradient(120%_90%_at_50%_-10%,rgba(124,58,237,0.3),transparent_55%)]" />

      {/* Animated cyber-matrix grid. The mask + opacity live on this STATIC
          wrapper and only the tile layer inside it moves. Animating
          `background-position` instead is paint-only: it repaints this masked,
          full-viewport layer every frame forever, and because this canvas is
          the backdrop every glass panel samples, that repaint forces a re-blur
          of every backdrop-filter element on the page — even while it sits
          idle. A transform on the inner layer is handled by the compositor with
          no repaint. -560px is exactly 10 × the 56px tile, so the loop is
          pixel-identical. */}
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

      {/* Ambient glow orbs — blur-[100px] on mobile for fast GPU rastering,
          full blur from sm up. Static, zero animation overhead. Each keeps its
          own compositor layer even though nothing animates: without it, the
          glass panels sampling this canvas can force a mid-scroll re-raster of
          the orb layer, which shows as a one-frame saturation swing. */}
      <div id="bg-orb-purple" className="absolute -top-32 -left-24 h-[36rem] w-[36rem] rounded-full bg-[#8b5cf6]/24 dark:bg-[#8b5cf6]/30 blur-[100px] sm:blur-[130px] transform-gpu [backface-visibility:hidden] [transform:translateZ(0)]" />
      {/* Parked behind the nav/dropdown zone so the glass there has color to frost */}
      <div id="bg-orb-blue" className="absolute -top-24 right-[12%] h-[26rem] w-[26rem] rounded-full bg-[#60a5fa]/15 dark:bg-[#60a5fa]/20 blur-[100px] sm:blur-[120px] transform-gpu [backface-visibility:hidden] [transform:translateZ(0)]" />
      <div id="bg-orb-pink" className="absolute top-1/3 -right-28 h-[32rem] w-[32rem] rounded-full bg-[#e64bd6]/22 dark:bg-[#e64bd6]/25 blur-[100px] sm:blur-[130px] transform-gpu [backface-visibility:hidden] [transform:translateZ(0)]" />
      <div id="bg-orb-teal" className="absolute bottom-0 left-1/4 h-[28rem] w-[28rem] rounded-full bg-[#2dd4bf]/20 dark:bg-[#2dd4bf]/20 blur-[100px] sm:blur-[130px] transform-gpu [backface-visibility:hidden] [transform:translateZ(0)]" />

      {/* Cursor spotlight — hidden on touch devices from globals.css */}
      <div
        id="cursor-spotlight"
        className="absolute inset-0 transition-[background] duration-300"
        style={{
          background: `radial-gradient(460px circle at ${pos.x}% ${pos.y}%, rgba(168,85,247,0.12), transparent 60%)`,
        }}
      />
    </div>
  );
}
