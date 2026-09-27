export const revalidate = 43200;

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { fetchPostSummaries, fetchSettings } from '@/lib/data';
import GridPageSkeleton from '@/components/GridPageSkeleton';

const SearchClient = dynamic(() => import('./SearchClient'));

export default async function SearchPage() {
  const posts = await fetchPostSummaries();
  const settings = await fetchSettings();
  
  return (
    <Suspense fallback={<GridPageSkeleton showHero={false} posts={posts.slice(0, 16)} />}>
      <SearchClient posts={posts} settings={settings} />
    </Suspense>
  );
}
