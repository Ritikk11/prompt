'use client';

import { useData } from '@/components/context/DataContext';
import GridPageSkeleton from '@/components/GridPageSkeleton';

export default function Loading() {
  const { settings, posts } = useData();
  const heroVariant = settings?.discoveryPages?.heroStyle === 'simple' ? 'simple' : 'container';
  const showHeroStats = settings?.discoveryPages?.showHeroStats ?? true;

  return (
    <GridPageSkeleton
      heroVariant={heroVariant}
      showBreadcrumbs={true}
      showHeroStats={showHeroStats}
      posts={posts}
    />
  );
}
