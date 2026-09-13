'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { PrefetchKind } from 'next/dist/client/components/router-reducer/router-reducer-types';
import { forwardRef, useCallback, useEffect, useRef, type ComponentProps } from 'react';
import { createPrefetchPolicy, getPrefetchHref, normalizeDiscoveryHref, type PrefetchTrigger } from '@/lib/prefetch-policy';

type Props = Omit<ComponentProps<typeof NextLink>, 'prefetch'> & {
  prefetch?: boolean | 'intent';
};

const policy = createPrefetchPolicy();
let nextViewportSlot = 0;

function canPrefetch() {
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  return navigator.onLine !== false && document.visibilityState === 'visible'
    && !connection?.saveData && !['slow-2g', '2g'].includes(connection?.effectiveType || '');
}

/** Next owns navigation/cache; this component bounds when prefetch is requested. */
const PrefetchLink = forwardRef<HTMLAnchorElement, Props>(function PrefetchLink({
  prefetch = true, onMouseEnter, onFocus, onTouchStart, ...props
}, forwardedRef) {
  const router = useRouter();
  const anchor = useRef<HTMLAnchorElement | null>(null);
  const setRef = useCallback((node: HTMLAnchorElement | null) => {
    anchor.current = node;
    if (typeof forwardedRef === 'function') return forwardedRef(node);
    if (forwardedRef) forwardedRef.current = node;
  }, [forwardedRef]);

  const warm = useCallback((trigger: PrefetchTrigger) => {
    const element = anchor.current;
    if (process.env.NODE_ENV !== 'production' || prefetch === false || !element || !canPrefetch()) return;
    if (element.hasAttribute('download') || (element.target && element.target !== '_self')) return;
    const href = getPrefetchHref(element.href, window.location.href);
    if (!href) return;
    const onInvalidate = policy.claim(href, trigger, Date.now());
    if (!onInvalidate) return;
    try {
      router.prefetch(href, { kind: PrefetchKind.FULL, onInvalidate });
    } catch {
      // Failed speculation must never prevent a normal click or retry itself.
      onInvalidate();
    }
  }, [prefetch, router]);

  useEffect(() => {
    if (prefetch !== true || !anchor.current || !('IntersectionObserver' in window)) return;
    const element = anchor.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (timer) clearTimeout(timer);
      if (!entry.isIntersecting) return;
      // A short dwell avoids prefetching links passed during a quick scroll;
      // stagger visible cards so they don't all contend with initial assets.
      const now = Date.now();
      nextViewportSlot = Math.max(now + 300, nextViewportSlot);
      const delay = Math.min(nextViewportSlot - now, 5000);
      nextViewportSlot += 150;
      timer = setTimeout(() => {
        warm('viewport');
        observer.disconnect();
      }, delay);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [prefetch, props.href, warm]);

  const href = typeof props.href === 'string'
    ? normalizeDiscoveryHref(props.href)
    : { ...props.href, pathname: normalizeDiscoveryHref(props.href.pathname || '') };

  return <NextLink {...props} href={href} ref={setRef} prefetch={false}
    onMouseEnter={event => { onMouseEnter?.(event); if (!event.defaultPrevented) warm('intent'); }}
    onFocus={event => { onFocus?.(event); if (!event.defaultPrevented) warm('intent'); }}
    onTouchStart={event => { onTouchStart?.(event); if (!event.defaultPrevented) warm('intent'); }}
  />;
});

export default PrefetchLink;
