'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode, type Ref } from 'react';

/**
 * Reveals its children the first time they cross the trigger line (elements
 * already in view animate on load). Animates once, respects
 * prefers-reduced-motion.
 *
 * The motion itself lives in app/globals.css under "Reveal model" — this
 * component only adds `.revealed` at the right moment. Keeping the CSS in the
 * render-blocking stylesheet is what makes the pre-reveal rest state hold from
 * the first paint; injecting it at hydration made painted content blink out and
 * re-enter.
 *
 * Two structural notes on the CSS it drives:
 *  - The wrapper never animates opacity. Glass surfaces do not compute their
 *    frost while faded, so fading a card is the "background shift" flash. The
 *    surface rises via a transform-only animation and the content inside fades.
 *  - One shared IntersectionObserver for every instance, with a sweep on each
 *    intersection, so a fast scroll past several sections can never strand one
 *    of them hidden.
 */

const pending = new Set<HTMLElement>();
let observer: IntersectionObserver | null = null;
let scheduledSweep: number | null = null;

// Debounced sweep for stranded elements, batched in a single animation frame
// to avoid forced synchronous layout recalculation during hydration.
function scheduleSweep() {
  if (typeof window === 'undefined' || scheduledSweep !== null || pending.size === 0) return;
  scheduledSweep = window.requestAnimationFrame(() => {
    scheduledSweep = null;
    const trigger = window.innerHeight - 80;
    const ready: HTMLElement[] = [];
    pending.forEach(node => {
      const rect = node.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      if (rect.top < trigger) ready.push(node);
    });
    for (const node of ready) {
      node.classList.add('revealed');
      pending.delete(node);
      observer?.unobserve(node);
    }
  });
}

function handleIntersection(entries: IntersectionObserverEntry[]) {
  let hasIntersecting = false;
  for (const entry of entries) {
    if (entry.isIntersecting) {
      hasIntersecting = true;
      const node = entry.target as HTMLElement;
      node.classList.add('revealed');
      pending.delete(node);
      observer?.unobserve(node);
    }
  }
  // If fast-scrolling crossed an element, schedule a single batched check for any stranded siblings
  if (hasIntersecting && pending.size > 0) {
    scheduleSweep();
  }
}

function register(node: HTMLElement) {
  // Tells the arming script in app/layout.tsx that hydration made it, so it
  // stops its disarm timer. Set on every register (cheap) so it holds even if
  // the first instance mounts late behind a bundle split.
  (window as unknown as { __revealReady?: boolean }).__revealReady = true;

  // No arming class means the script already gave up waiting and showed the
  // content. Animating now would re-reveal the whole page in one pop, so adopt
  // it where it stands. (Also covers the script never having run at all.)
  if (!document.documentElement.classList.contains('reveal-armed')) {
    node.classList.add('revealed', 'reveal-adopted');
    return;
  }

  if (!observer) {
    observer = new IntersectionObserver(handleIntersection, {
      threshold: 0,
      rootMargin: '0px 0px -80px 0px',
    });
  }
  pending.add(node);
  observer.observe(node);
}

function unregister(node: HTMLElement) {
  pending.delete(node);
  observer?.unobserve(node);
}

type ScrollRevealProps = {
  children: ReactNode;
  /** Extra delay in ms before the animation starts, for staggering siblings */
  delay?: number;
  /** Animate direct children one after another instead of the whole block */
  stagger?: boolean;
  /** Like stagger, but children fade only (no translateY) — for overflow-x rows */
  staggerFade?: boolean;
  /** Text/header variant */
  slide?: boolean;
  /** Rise-only, no content fade — for grids whose leaves are glass (masonry
      post-card mats): the default content fade would flash their frost */
  plain?: boolean;
  className?: string;
  /** React 19 ref-as-prop: lets callers reach the wrapper (e.g. scroll rows) */
  ref?: Ref<HTMLDivElement>;
};

export default function ScrollReveal({
  children,
  delay = 0,
  stagger = false,
  staggerFade = false,
  slide = false,
  plain = false,
  className = '',
  ref,
}: ScrollRevealProps) {
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
      node.classList.add('revealed');
      return;
    }
    register(node);
    return () => unregister(node);
  }, []);

  const variant = slide
    ? 'reveal-slide'
    : staggerFade
      ? 'reveal-stagger-fade'
      : stagger
        ? 'reveal-stagger'
        : plain
          ? 'reveal-plain'
          : 'reveal-glass';
  const style = delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined;

  return (
    <div ref={setRef} className={`reveal ${variant} ${className}`} style={style}>
      {children}
    </div>
  );
}
