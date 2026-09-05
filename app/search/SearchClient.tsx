'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Search as SearchIcon } from 'lucide-react';
import SkeletonPostCard from '@/components/SkeletonPostCard';
import { getGridClasses } from '@/lib/utils';
import type { Post, SiteSettings } from '@/lib/types';

import PostCard from '@/components/PostCard';
import MasonryGrid from '@/components/MasonryGrid';
import ScrollReveal from '@/components/ScrollReveal';

function SearchContent({ posts, settings }: { posts: Post[], settings: SiteSettings }) {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const searchPosts = (q: string) => {
    if (!q) return [];
    const term = q.toLowerCase();
    return posts.filter(p => 
      ((p.status === 'published' || !p.status) && p.visibility !== 'private') &&
      (p.title.toLowerCase().includes(term) ||
      p.tags.some(t => t.toLowerCase().includes(term)) ||
      p.seoKeywords?.some((k: string) => k.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term)))
    );
  };

  const results = searchPosts(query);

  return (
    <div className="max-w-7xl mx-auto px-2 py-4 sm:py-6 fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SearchIcon className="w-6 h-6 text-primary-500" />
          <h1 className="text-2xl md:text-3xl font-bold">Search Results</h1>
        </div>
        {query && (
          <p className="text-surface-500 dark:text-surface-400">
            {`${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
          </p>
        )}
      </div>

      {results.length > 0 ? (
        <ScrollReveal>
          <MasonryGrid
            posts={results}
            settings={settings}
          />
        </ScrollReveal>
      ) : (
        <div className="text-center py-20">
          <SearchIcon className="w-16 h-16 text-surface-200 dark:text-surface-700 mx-auto mb-4" />
          <p className="text-xl font-semibold text-surface-400">No results found</p>
          <p className="text-sm text-surface-400 mt-2 mb-6">Try different keywords or browse collections</p>
          <Link href="/" className="px-5 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors">
            Back to Home
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SearchClient({ posts, settings }: { posts: Post[], settings: SiteSettings }) {
  // The fallback has to use the SAME grid helper and card style as the real
  // results, or a 1-column mobile setting still gets a 2-up skeleton grid that
  // reflows the moment the results land.
  const skeletonCardStyle = settings.cardStyle === 'v1' ? 'v1' : 'v2';
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-2 py-8">
        <div className="mb-8 h-8 w-1/4 animate-pulse rounded bg-black/[0.07] dark:bg-white/[0.09]" />
        <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
          {[...Array(4)].map((_, i) => (
            <SkeletonPostCard key={i} cardStyle={skeletonCardStyle} />
          ))}
        </div>
      </div>
    }>
      <SearchContent posts={posts} settings={settings} />
    </Suspense>
  );
}
