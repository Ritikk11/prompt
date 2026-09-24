'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type ComponentProps } from 'react';

// The comments island sits at the very bottom of the post page and is purely
// interactive (not SEO content), so we skip SSR and defer its hydration until
// after the initial render. That keeps react + the comments tree out of the
// first hydration pass, cutting Total Blocking Time on load.
const CommentsSection = dynamic(() => import('@/components/post/CommentsSection'), {
  ssr: false,
  loading: () => null,
});

export default function CommentsSectionLazy(props: ComponentProps<typeof CommentsSection>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '400px' });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ minHeight: 400 }}>
      {visible ? <CommentsSection {...props} /> : null}
    </div>
  );
}
