'use client';

import { usePathname } from 'next/navigation';
import { useData } from '@/components/context/DataContext';
import PromptSkeleton from '@/components/PromptSkeleton';
import GridPageSkeleton from '@/components/GridPageSkeleton';

const NON_SLUG_ROUTES = new Set([
  '',
  'explore',
  'about',
  'contact',
  'cookies',
  'disclaimer',
  'dmca',
  'privacy',
  'terms',
  'search',
  'admin',
  'api',
  'profile',
  'login',
  'submit',
  'user',
]);

export default function Loading() {
  const pathname = usePathname();
  const { seoPages, posts } = useData();
  const slug = pathname?.replace(/^\/+/, '').split('/')[0]?.toLowerCase();

  // If navigating away to a known non-slug route, never render a prompt skeleton
  if (!slug || NON_SLUG_ROUTES.has(slug)) {
    return null;
  }

  // Suppress skeleton entirely during back/forward navigation (popstate).
  // BackButton sets __lastBackNavTime before calling router.back().
  if (
    typeof window !== 'undefined' &&
    Date.now() - ((window as any).__lastBackNavTime || 0) < 1000
  ) {
    return null;
  }

  const seoPage = seoPages?.find(p => (p.slug || p.id)?.toLowerCase() === slug);

  if (seoPage) {
    const heroVariant = seoPage.heroStyle === 'simple' ? 'simple' : 'container';
    return (
      <GridPageSkeleton
        heroVariant={heroVariant}
        showBreadcrumbs={true}
        showHeroStats={true}
        posts={posts}
      />
    );
  }

  return <PromptSkeleton />;
}
