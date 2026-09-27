'use client';

import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useData } from '@/components/context/DataContext';
import PromptSkeleton from '@/components/PromptSkeleton';
import GridPageSkeleton from '@/components/GridPageSkeleton';

const NON_PROMPT_PREFIXES = new Set([
  '',
  'about',
  'admin',
  'api',
  'applet',
  'auth',
  'blog',
  'collection-preview',
  'contact',
  'cookies',
  'disclaimer',
  'dmca',
  'explore',
  'guides',
  'login',
  'page',
  'privacy',
  'profile',
  'search',
  'section',
  'submit',
  'terms',
  'tool',
  'user',
]);

type TransitionType = 'prompt' | 'seo' | 'grid';

// ─── Module-level back-navigation dead zone ────────────────────────────────
// Uses CSS pointer-events:none on body — this is the ONLY reliable approach.
// It blocks ghost taps at CSS hit-test time, before ANY JS listener (ours or
// Next.js internals) can fire. JS event blocking (stopImmediatePropagation)
// is listener-order dependent and can't catch listeners registered before ours.
const BACK_DEAD_ZONE_MS = 800;
let isInBackDeadZone = false;
let backDeadZoneTimer: ReturnType<typeof setTimeout> | null = null;

function enterBackDeadZone() {
  isInBackDeadZone = true;
  // Block all pointer interactions so ghost taps can't reach any link or card
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.pointerEvents = 'none';
  }
  if (backDeadZoneTimer) clearTimeout(backDeadZoneTimer);
  backDeadZoneTimer = setTimeout(() => {
    isInBackDeadZone = false;
    backDeadZoneTimer = null;
    // Restore pointer events once ghost tap window has passed
    if (typeof document !== 'undefined' && document.body) {
      document.body.style.pointerEvents = '';
    }
  }, BACK_DEAD_ZONE_MS);
}

if (typeof window !== 'undefined') {
  // Fired by browser back/forward gesture or router.back()
  window.addEventListener('popstate', () => enterBackDeadZone(), { passive: true });
}


// Called externally by BackButton so the dead zone starts at button-click time
// (before the async popstate fires), catching very fast ghost taps.
export function markBackNavigation() {
  if (typeof window !== 'undefined') {
    (window as any).__lastBackNavTime = Date.now();
  }
  enterBackDeadZone();
}

export default function NavigationTransitionHandler({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { seoPages, sections, settings, posts } = useData();

  // Active transition info: remembers origin and destination
  const [transition, setTransition] = useState<{
    originPath: string;
    targetPath: string;
    type: TransitionType;
  } | null>(null);

  // Ref always holds the current transition value so click handler avoids stale closure
  const transitionRef = useRef(transition);
  useEffect(() => {
    transitionRef.current = transition;
  }, [transition]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showSkeleton = settings?.features?.skeletonLoaders ?? true;

  // Derive whether we are actively transitioning:
  // ONLY true if transition was initiated AND we are still on the origin page.
  // The moment pathname changes away from originPath, isTransitioning is instantly false.
  const isTransitioning = Boolean(
    showSkeleton &&
      transition &&
      pathname &&
      pathname.toLowerCase() === transition.originPath.toLowerCase() &&
      pathname.toLowerCase() !== transition.targetPath.toLowerCase()
  );

  // Clear transition once route has committed away from origin
  useEffect(() => {
    if (transition && pathname && pathname.toLowerCase() !== transition.originPath.toLowerCase()) {
      setTransition(null);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [pathname, transition]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Listen to popstate (back/forward) and Escape key to immediately cancel any transition
  useEffect(() => {
    const handleCancel = () => {
      enterBackDeadZone();
      setTransition(null);
      transitionRef.current = null;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Belt-and-suspenders: also clear on next tick in case React batched
      setTimeout(() => {
        setTransition(null);
        transitionRef.current = null;
      }, 0);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('popstate', handleCancel, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handleCancel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Listen for in-app anchor clicks site-wide
  useEffect(() => {
    if (!showSkeleton) return;

    const handleDocumentClick = (event: MouseEvent) => {
      // ── 1. Dead zone: block ALL anchor clicks during/after back navigation ──
      // Uses a boolean flag (not timing) so it's reliable. Also checks
      // the timestamp fallback for cases where enterBackDeadZone wasn't called.
      if (isInBackDeadZone) {
        event.preventDefault();
        event.stopImmediatePropagation(); // kills ALL listeners, including React's
        return;
      }

      // Fallback timing guard (e.g. if module reloaded between events)
      const lastBackTime = Math.max(
        typeof window !== 'undefined' ? (window as any).__lastBackNavTime || 0 : 0
      );
      if (lastBackTime && Date.now() - lastBackTime < BACK_DEAD_ZONE_MS) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      // ── 2. Ignore if a transition is already in-flight (ref-based, no stale closure) ──
      if (transitionRef.current) {
        return;
      }

      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      try {
        const nextUrl = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        if (nextUrl.origin !== currentUrl.origin) return;

        // Normalized pathnames without trailing slashes
        const nextPath = nextUrl.pathname.replace(/\/+$/, '') || '/';
        const currentPath = currentUrl.pathname.replace(/\/+$/, '') || '/';

        if (nextPath.toLowerCase() === currentPath.toLowerCase()) return;

        const pathSegment = nextPath.replace(/^\/+/, '').split('/')[0].toLowerCase();

        // Admin, auth, API, profile, submit pages don't get prompt/gallery skeletons
        if (['admin', 'api', 'auth', 'login', 'profile', 'submit', 'applet', 'user'].includes(pathSegment)) {
          return;
        }

        // Determine destination type
        let type: TransitionType | null = null;

        if (nextPath.startsWith('/explore')) {
          type = 'grid';
        } else if (nextPath.startsWith('/section/')) {
          type = 'grid';
        } else if (nextPath.startsWith('/tool/')) {
          type = 'grid';
        } else if (nextPath.startsWith('/search')) {
          type = 'grid';
        } else if (!NON_PROMPT_PREFIXES.has(pathSegment)) {
          // Single-segment path: check if it's an SEO collection page or a prompt post
          const isSeo = seoPages?.some(p => (p.slug || p.id).toLowerCase() === pathSegment);
          type = isSeo ? 'seo' : 'prompt';
        }

        if (type) {
          // Instantly scroll to top so the skeleton starts from the top of the viewport
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });

          const newTransition = {
            originPath: currentPath,
            targetPath: nextPath,
            type,
          };
          setTransition(newTransition);
          transitionRef.current = newTransition;

          // 5-second safety fallback: in case navigation is cancelled or network fails
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            setTransition(null);
            transitionRef.current = null;
          }, 5000);
        }
      } catch {
        // Safe fallback
      }
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [showSkeleton, seoPages]);

  // Render the instant skeleton if transitioning
  if (isTransitioning && transition) {
    if (transition.type === 'prompt') {
      return <PromptSkeleton />;
    }

    if (transition.type === 'seo') {
      const slug = transition.targetPath.replace(/^\/+/, '').split('/')[0].toLowerCase();
      const seoPage = seoPages?.find(p => (p.slug || p.id).toLowerCase() === slug);
      const heroVariant = seoPage?.heroStyle === 'simple' ? 'simple' : 'container';
      return (
        <GridPageSkeleton
          heroVariant={heroVariant}
          showBreadcrumbs={true}
          showHeroStats={settings.discoveryPages?.showHeroStats ?? true}
          posts={posts}
        />
      );
    }

    if (transition.type === 'grid') {
      let heroVariant: 'container' | 'simple' = 'container';
      let showBreadcrumbs = false;
      let showHero = true;

      if (transition.targetPath.startsWith('/section/')) {
        const slug = transition.targetPath.replace(/^\/section\//i, '').split('/')[0].toLowerCase();
        const section = sections?.find(s => (s.slug || s.id).toLowerCase() === slug);
        heroVariant = section?.heroStyle === 'simple' ? 'simple' : 'container';
        showBreadcrumbs = true;
      } else if (transition.targetPath.startsWith('/tool/')) {
        heroVariant = settings.discoveryPages?.heroStyle === 'simple' ? 'simple' : 'container';
        showBreadcrumbs = true;
      } else if (transition.targetPath.startsWith('/explore')) {
        heroVariant = settings.discoveryPages?.heroStyle === 'simple' ? 'simple' : 'container';
      } else if (transition.targetPath.startsWith('/search')) {
        showHero = false;
      }

      return (
        <GridPageSkeleton
          showHero={showHero}
          heroVariant={heroVariant}
          showBreadcrumbs={showBreadcrumbs}
          showHeroStats={settings.discoveryPages?.showHeroStats ?? true}
          posts={posts}
        />
      );
    }
  }

  return <>{children}</>;
}
