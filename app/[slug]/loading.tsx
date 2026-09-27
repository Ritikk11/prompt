'use client';

import { usePathname } from 'next/navigation';
import { useData } from '@/components/context/DataContext';
import PromptSkeleton from '@/components/PromptSkeleton';
import GridPageSkeleton from '@/components/GridPageSkeleton';

export default function Loading() {
  const pathname = usePathname();
  const { seoPages, posts } = useData();
  const slug = pathname?.replace(/^\/+/, '').split('/')[0];
  const seoPage = seoPages?.find(p => p.slug === slug || p.id === slug);

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
