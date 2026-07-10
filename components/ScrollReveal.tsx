'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type ScrollRevealProps = {
  children: ReactNode;
  /** Extra transition delay in ms, for staggering siblings */
  delay?: number;
  className?: string;
};

/**
 * Reveals its children with a fade + slide-up the first time they enter the
 * viewport (elements already in view animate immediately on load).
 * Animates once, respects prefers-reduced-motion.
 */
export default function ScrollReveal({ children, delay = 0, className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      // Low threshold + small negative bottom margin: tall sections still
      // trigger reliably, but only once they meaningfully enter the viewport.
      { threshold: 0.05, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal-root ${visible ? 'reveal-visible' : ''} ${className}`}
      style={{ animationDelay: visible && delay ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}
