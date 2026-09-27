'use client';

import { usePathname } from 'next/navigation';
import { useData } from '@/components/context/DataContext';
import GridPageSkeleton from '@/components/GridPageSkeleton';

export default function Loading() {
  const pathname = usePathname();
  const { sections, posts, settings } = useData();
  const slug = pathname?.replace(/^\/+/, '').split('/')[1];
  const section = sections?.find(s => s.slug === slug || s.id === slug);
  const heroVariant = section?.heroStyle === 'simple' ? 'simple' : 'container';
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
