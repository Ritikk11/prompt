'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { forwardRef, type ComponentProps } from 'react';
import { normalizeDiscoveryHref } from '@/lib/prefetch-policy';

type Props = Omit<ComponentProps<typeof NextLink>, 'prefetch'> & {
  prefetch?: boolean | 'intent';
};

const prefetchedUrls = new Set<string>();

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

const PrefetchLink = forwardRef<HTMLAnchorElement, Props>(function PrefetchLink(
  { prefetch = true, onMouseEnter, onFocus, onTouchStart, href: rawHref, ...props },
  forwardedRef
) {
  const router = useRouter();

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

  return (
    <NextLink
      {...props}
      href={href}
      ref={forwardedRef}
      prefetch={false}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        if (!event.defaultPrevented) warm();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (!event.defaultPrevented) warm();
      }}
      onTouchStart={(event) => {
        onTouchStart?.(event);
        if (!event.defaultPrevented) warm();
      }}
    />
  );
});

export default PrefetchLink;

