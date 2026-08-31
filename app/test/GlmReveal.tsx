'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode, type Ref } from 'react';

/*
 * Scroll reveal for the test page — ports the SectionReveal motion from the
 * stylish about-us design, which is the same recipe as the main site's
 * reveal-section-in: 32px rise, opacity in, 0.7s with ease
 * cubic-bezier(0.25, 0.46, 0.45, 0.94), triggered once ~80px before the
 * element enters the viewport. Grid items cascade at 100ms steps (the design
 * uses index * 0.1 delays), capped at 600ms.
 *
 * Performance fixes over the main site's implementation (look is identical):
 *  - Stagger containers fade only; only the children translate. Main moves
 *    the section AND each child, so glass cards carry nested transforms and
 *    their backdrop blur gets re-sampled twice per frame.
 *  - One shared IntersectionObserver (main creates one per component) with a
 *    sweep on every intersection, so fast scrolls never strand content hidden.
 *  - backface-visibility promotes animating cards to compositor layers.
 *
 * Keeps main's semantics: animates once, pointer-events off while hidden,
 * delay prop, prefers-reduced-motion fallback.
 */

export const REVEAL_CSS = `
/* ── Reveal model ─────────────────────────────────────────────────────────
   Glass surfaces (backdrop-filter) must never be opacity-hidden or
   opacity-animated — the frost is not computed while faded, which is the
   "bg shift" flash. TRANSFORM motion is safe (the slider badge translates
   on every slide and keeps its frost). So: the card surface rises via a
   transform-only animation (pre-reveal it rests 18px lower, fully painted),
   and the content inside fades + slides. Combined ≈ the original reveal. */
.glm-reveal.glm-glass > *,
.glm-reveal.glm-slide > *,
.glm-reveal.glm-stagger > *,
.glm-reveal.glm-plain > * {
  transform: translateY(18px);
  will-change: transform;
  backface-visibility: hidden;
}
.glm-reveal.glm-glass.glm-revealed > *,
.glm-reveal.glm-slide.glm-revealed > *,
.glm-reveal.glm-stagger.glm-revealed > *,
.glm-reveal.glm-plain.glm-revealed > * {
  transform: none;
  animation: glm-card-rise 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) backwards;
  animation-delay: var(--glm-delay, 0ms);
}
.glm-reveal.glm-stagger.glm-revealed > *:nth-child(2) { animation-delay: calc(var(--glm-delay, 0ms) + 100ms); }
.glm-reveal.glm-stagger.glm-revealed > *:nth-child(3) { animation-delay: calc(var(--glm-delay, 0ms) + 200ms); }
.glm-reveal.glm-stagger.glm-revealed > *:nth-child(4) { animation-delay: calc(var(--glm-delay, 0ms) + 300ms); }
.glm-reveal.glm-stagger.glm-revealed > *:nth-child(5) { animation-delay: calc(var(--glm-delay, 0ms) + 400ms); }
.glm-reveal.glm-stagger.glm-revealed > *:nth-child(n+6) { animation-delay: calc(var(--glm-delay, 0ms) + 500ms); }
@keyframes glm-card-rise {
  from { transform: translateY(18px); }
  to { transform: none; }
}

/* Content inside the card: pure smooth fade-in (avoids conflicting compound transforms with outer card rise) */
.glm-reveal-armed .glm-reveal.glm-glass:not(.glm-revealed) > * > *,
.glm-reveal-armed .glm-reveal.glm-slide:not(.glm-revealed) > * > *,
.glm-reveal-armed .glm-reveal.glm-stagger:not(.glm-revealed) > * > * {
  opacity: 0;
  pointer-events: none;
}
.glm-reveal.glm-glass.glm-revealed > * > *,
.glm-reveal.glm-slide.glm-revealed > * > * {
  animation: glm-reveal-fade-in 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) backwards;
  animation-delay: var(--glm-delay, 0ms);
  backface-visibility: hidden;
}
.glm-reveal.glm-stagger.glm-revealed > * > * {
  animation: glm-reveal-fade-in 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) backwards;
  animation-delay: var(--glm-delay, 0ms);
  backface-visibility: hidden;
}
.glm-reveal.glm-stagger.glm-revealed > *:nth-child(2) > * { animation-delay: calc(var(--glm-delay, 0ms) + 100ms); }
.glm-reveal.glm-stagger.glm-revealed > *:nth-child(3) > * { animation-delay: calc(var(--glm-delay, 0ms) + 200ms); }
.glm-reveal.glm-stagger.glm-revealed > *:nth-child(4) > * { animation-delay: calc(var(--glm-delay, 0ms) + 300ms); }
.glm-reveal.glm-stagger.glm-revealed > *:nth-child(5) > * { animation-delay: calc(var(--glm-delay, 0ms) + 400ms); }
.glm-reveal.glm-stagger.glm-revealed > *:nth-child(n+6) > * { animation-delay: calc(var(--glm-delay, 0ms) + 500ms); }

/* Fade-only stagger for horizontal overflow-x rows */
.glm-reveal-armed .glm-reveal.glm-stagger-fade:not(.glm-revealed) { opacity: 0; }
.glm-reveal.glm-stagger-fade.glm-revealed {
  animation: glm-reveal-fade-in 0.5s ease-out backwards;
  animation-delay: var(--glm-delay, 0ms);
}
.glm-reveal.glm-stagger-fade.glm-revealed > * {
  animation: glm-reveal-fade-in 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) backwards;
  animation-delay: var(--glm-delay, 0ms);
}
.glm-reveal.glm-stagger-fade.glm-revealed > *:nth-child(2) { animation-delay: calc(var(--glm-delay, 0ms) + 100ms); }
.glm-reveal.glm-stagger-fade.glm-revealed > *:nth-child(3) { animation-delay: calc(var(--glm-delay, 0ms) + 200ms); }
.glm-reveal.glm-stagger-fade.glm-revealed > *:nth-child(4) { animation-delay: calc(var(--glm-delay, 0ms) + 300ms); }
.glm-reveal.glm-stagger-fade.glm-revealed > *:nth-child(5) { animation-delay: calc(var(--glm-delay, 0ms) + 400ms); }
.glm-reveal.glm-stagger-fade.glm-revealed > *:nth-child(n+6) { animation-delay: calc(var(--glm-delay, 0ms) + 500ms); }
@keyframes glm-reveal-in {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: none; }
}
@keyframes glm-reveal-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* Adopted state: hydration arrived AFTER the arming script gave up, so the
   content is already on screen unstyled-by-reveal. Land it exactly where it
   already is instead of animating it in, which would be a visible re-reveal
   pop of the whole page at once. Only ever set on a degraded (slow) load. */
.glm-reveal.glm-adopted,
.glm-reveal.glm-adopted > *,
.glm-reveal.glm-adopted > * > * {
  animation: none !important;
  opacity: 1 !important;
  transform: none !important;
}
@media (prefers-reduced-motion: reduce) {
  .glm-reveal > * { transform: none !important; }
  .glm-reveal, .glm-reveal > *, .glm-reveal > * > * {
    animation: none !important;
    opacity: 1 !important;
    pointer-events: auto !important;
  }
}
`;

const pending = new Set<HTMLElement>();
let observer: IntersectionObserver | null = null;
let styleInjected = false;

// Reveal every registered node that is already above the trigger line. This
// sweep runs on any intersection, so fast scrolls never strand content hidden.
// Trigger line matches the design's useInView margin of -80px.
function sweep() {
  const trigger = window.innerHeight - 80;
  // Read every rect BEFORE mutating any class. Interleaving the two made each
  // classList.add() invalidate layout, so the next getBoundingClientRect()
  // forced a fresh full-document layout — up to one per revealed node, all
  // inside a single scroll frame, which showed up as scroll jitter while nodes
  // were still crossing the trigger line. Batching makes it one layout pass no
  // matter how many nodes cross at once. Same nodes, same timing.
  const ready: HTMLElement[] = [];
  pending.forEach(node => {
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    if (rect.top < trigger) ready.push(node);
  });
  for (const node of ready) {
    node.classList.add('glm-revealed');
    pending.delete(node);
    observer?.unobserve(node);
  }
}

function register(node: HTMLElement) {
  // Tell TestClient's arming script that hydration made it, so it stops its
  // disarm timer. Set on every register (cheap) so it holds even if the very
  // first component mounts after a bundle split.
  (window as unknown as { __glmRevealReady?: boolean }).__glmRevealReady = true;

  // The arming class gone means the script already gave up waiting and showed
  // the content. Animating now would re-reveal the whole page in one pop, so
  // adopt it where it stands instead. (Also covers the arming script never
  // having run at all.)
  if (!document.documentElement.classList.contains('glm-reveal-armed')) {
    node.classList.add('glm-revealed', 'glm-adopted');
    return;
  }

  if (!styleInjected) {
    styleInjected = true;
    // The CSS is server-rendered by TestClient (<style id="glm-reveal-css">) so
    // `.glm-reveal { opacity: 0 }` holds from the very first paint — injecting
    // it only here (at hydration) made already-painted content blink out and
    // re-enter. This fallback covers standalone use without that SSR tag.
    if (!document.getElementById('glm-reveal-css')) {
      const el = document.createElement('style');
      el.id = 'glm-reveal-css';
      el.textContent = REVEAL_CSS;
      document.head.appendChild(el);
    }
  }
  if (!observer) {
    observer = new IntersectionObserver(() => sweep(), {
      threshold: 0,
      rootMargin: '0px 0px -80px 0px',
    });
  }
  pending.add(node);
  observer.observe(node);
  sweep();
}

function unregister(node: HTMLElement) {
  pending.delete(node);
  observer?.unobserve(node);
}

type GlmRevealProps = {
  children: ReactNode;
  /** Extra delay in ms before the animation starts */
  delay?: number;
  /** Animate direct children one after another instead of the whole block */
  stagger?: boolean;
  /** Like stagger, but children fade only (no translateY) — for overflow-x rows */
  staggerFade?: boolean;
  /** Text/header variant with a slightly longer travel */
  slide?: boolean;
  /** Rise-only, no content fade — for grids whose leaves are glass (masonry
      post-card mats): the default content fade would flash their frost */
  plain?: boolean;
  className?: string;
  /** React 19 ref-as-prop: lets callers reach the wrapper (e.g. scroll rows) */
  ref?: Ref<HTMLDivElement>;
};

export default function GlmReveal({ children, delay = 0, stagger = false, staggerFade = false, slide = false, plain = false, className = '', ref }: GlmRevealProps) {
  const innerRef = useRef<HTMLDivElement>(null);

  const setRef = (node: HTMLDivElement | null) => {
    innerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
  };

  useEffect(() => {
    const node = innerRef.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.classList.add('glm-revealed');
      return;
    }
    register(node);
    return () => unregister(node);
  }, []);

  const variant = slide ? 'glm-slide' : staggerFade ? 'glm-stagger-fade' : stagger ? 'glm-stagger' : plain ? 'glm-plain' : 'glm-glass';
  const style = delay ? ({ '--glm-delay': `${delay}ms` } as CSSProperties) : undefined;

  return (
    <div ref={setRef} className={`glm-reveal ${variant} ${className}`} style={style}>
      {children}
    </div>
  );
}
