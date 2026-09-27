'use client';

import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useData } from '@/components/context/DataContext';
import PromptSkeleton from '@/components/PromptSkeleton';
import GridPageSkeleton from '@/components/GridPageSkeleton';

const NON_PROMPT_PREFIXES = new Set([
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

type TransitionType = 'prompt' | 'seo' | 'grid' | null;

export default function NavigationTransitionHandler({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { seoPages, sections, settings, posts } = useData();
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [transitionType, setTransitionType] = useState<TransitionType>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSkeleton = settings?.features?.skeletonLoaders ?? true;

  // Derive transition state during render:
  // If targetPath is set and pathname hasn't updated yet, we are transitioning.
  // The moment Next.js commits the new route (pathname === targetPath), isTransitioning is instantly false.
  const isTransitioning = Boolean(
    showSkeleton && targetPath && pathname && targetPath.toLowerCase() !== pathname.toLowerCase()
  );

  // Clear targetPath once route has committed
  useEffect(() => {
    if (targetPath && pathname && targetPath.toLowerCase() === pathname.toLowerCase()) {
      setTargetPath(null);
      setTransitionType(null);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [pathname, targetPath]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Listen to popstate (back/forward) and Escape key to cancel any pending transition
  useEffect(() => {
    const handlePopState = () => {
      setTargetPath(null);
      setTransitionType(null);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handlePopState();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Listen for in-app anchor clicks site-wide
  useEffect(() => {
    if (!showSkeleton) return;

    const handleDocumentClick = (event: MouseEvent) => {
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
        let type: TransitionType = null;

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

          setTargetPath(nextPath);
          setTransitionType(type);

          // 6-second safety fallback: in case navigation is cancelled or network fails
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            setTargetPath(null);
            setTransitionType(null);
          }, 6000);
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
  if (isTransitioning) {
    if (transitionType === 'prompt') {
      return <PromptSkeleton />;
    }

    if (transitionType === 'seo') {
      const slug = targetPath?.replace(/^\/+/, '').split('/')[0].toLowerCase();
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

    if (transitionType === 'grid') {
      let heroVariant: 'container' | 'simple' = 'container';
      let showBreadcrumbs = false;
      let showHero = true;

      if (targetPath?.startsWith('/section/')) {
        const slug = targetPath.replace(/^\/section\//i, '').split('/')[0].toLowerCase();
        const section = sections?.find(s => (s.slug || s.id).toLowerCase() === slug);
        heroVariant = section?.heroStyle === 'simple' ? 'simple' : 'container';
        showBreadcrumbs = true;
      } else if (targetPath?.startsWith('/tool/')) {
        heroVariant = settings.discoveryPages?.heroStyle === 'simple' ? 'simple' : 'container';
        showBreadcrumbs = true;
      } else if (targetPath?.startsWith('/explore')) {
        heroVariant = settings.discoveryPages?.heroStyle === 'simple' ? 'simple' : 'container';
      } else if (targetPath?.startsWith('/search')) {
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
