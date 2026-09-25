'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { forwardRef, useEffect, useRef, type ComponentProps } from 'react';
import { normalizeDiscoveryHref } from '@/lib/prefetch-policy';

type Props = Omit<ComponentProps<typeof NextLink>, 'prefetch'> & {
  prefetch?: boolean | 'intent' | 'eager';
};

const prefetchedUrls = new Set<string>();
const INTENT_HOVER_DELAY_MS = 500;

function canPrefetch() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  return (
    navigator.onLine !== false &&
    document.visibilityState === 'visible' &&
    !connection?.saveData &&
    !['slow-2g', '2g'].includes(connection?.effectiveType || '')
  );
}

function hasFineHoverPointer() {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

const PrefetchLink = forwardRef<HTMLAnchorElement, Props>(function PrefetchLink(
  { prefetch = true, onMouseEnter, onMouseLeave, onFocus, onTouchStart, onPointerDown, href: rawHref, ...props },
  forwardedRef
) {
  const router = useRouter();
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const href = typeof rawHref === 'string'
    ? normalizeDiscoveryHref(rawHref)
    : { ...rawHref, pathname: normalizeDiscoveryHref(rawHref.pathname || '') };

  const hrefString = typeof href === 'string' ? href : (href.pathname || '');

  const warm = () => {
    if (prefetch === false || !canPrefetch()) return;
    if (!hrefString || hrefString.startsWith('http') || hrefString.startsWith('#') || hrefString.startsWith('mailto:')) return;
    // Don't prefetch current path or private/auth paths
    if (typeof window !== 'undefined') {
      try {
        const target = new URL(hrefString, window.location.href);
        if (target.origin !== window.location.origin) return;
        if (/^\/(api|admin|profile|login|submit|user|auth|test)(\/|$)/i.test(target.pathname)) return;
        const targetKey = target.pathname + target.search;
        const currentKey = window.location.pathname + window.location.search;
        if (targetKey === currentKey) return;
        if (prefetchedUrls.has(targetKey)) return;
        prefetchedUrls.add(targetKey);
        router.prefetch(targetKey);
      } catch {
        // Safe fallback
      }
    }
  };

  const cancelHoverWarm = () => {
    if (hoverTimerRef.current === null) return;
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
  };

  const scheduleIntentWarm = () => {
    if (!hasFineHoverPointer()) return;
    cancelHoverWarm();
    hoverTimerRef.current = setTimeout(() => {
      hoverTimerRef.current = null;
      warm();
    }, INTENT_HOVER_DELAY_MS);
  };

  useEffect(() => cancelHoverWarm, [hrefString, prefetch]);

  useEffect(() => {
    if (prefetch === 'eager' && canPrefetch()) {
      const win = typeof window !== 'undefined' ? window : null;
      if (!win) return;
      const idleCallback = win.requestIdleCallback || ((cb: () => void) => win.setTimeout(cb, 120));
      const cancelIdle = win.cancelIdleCallback || win.clearTimeout;
      const idleId = idleCallback(() => {
        warm();
      });
      return () => cancelIdle(idleId as any);
    }
  }, [prefetch, hrefString]);

  return (
    <NextLink
      {...props}
      href={href}
      ref={forwardedRef}
      prefetch={false}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        if (!event.defaultPrevented) {
          if (prefetch === 'intent') scheduleIntentWarm();
          else warm();
        }
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        cancelHoverWarm();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        // For intent links, only keyboard focus is a useful signal. Touch focus
        // must not turn an ordinary scroll gesture into a post-page request.
        if (!event.defaultPrevented && (prefetch !== 'intent' || event.currentTarget.matches(':focus-visible'))) warm();
      }}
      onTouchStart={(event) => {
        onTouchStart?.(event);
        // Touch has no hover, so this is the only pre-navigation signal we get
        // on mobile. It fires ~100-300ms before the actual tap-triggered nav,
        // which is enough to warm the RSC payload without prefetching every
        // card that merely scrolls past (scrolling doesn't fire touchstart on
        // a link the way an intentional tap does).
        if (!event.defaultPrevented) warm();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        // Mouse pointerdown on an 'intent' link means the hover-warm already
        // fired (or the click is happening fast enough that it doesn't
        // matter); only fall through here for non-mouse pointers we haven't
        // otherwise covered.
        if (!event.defaultPrevented && prefetch !== 'intent') warm();
      }}
    />
  );
});

export default PrefetchLink;

