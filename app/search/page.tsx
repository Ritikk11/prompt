'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

import { Search as SearchIcon } from 'lucide-react';
import { useData } from '@/components/context/DataContext';
import SkeletonPostCard from '@/components/SkeletonPostCard';

const PostCard = dynamic(() => import('@/components/PostCard'), {
  loading: () => <SkeletonPostCard />
});

function SearchContent() {
  const searchParams = useSearchParams();
  const { searchPosts, settings } = useData();
  const query = searchParams.get('q') || '';
  const results = searchPosts(query);

  return (
    <div className="max-w-7xl mx-auto px-1 py-4 sm:py-6 fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SearchIcon className="w-6 h-6 text-primary-500" />
          <h1 className="text-2xl md:text-3xl font-bold">Search Results</h1>
        </div>
        {query && (
          <p className="text-surface-500 dark:text-surface-400">
            {results.length} result{results.length !== 1 ? 's' : ''} for &quot;<span className="text-primary-500 font-medium">{query}</span>&quot;
          </p>
        )}
      </div>

      {results.length > 0 ? (
        <div className={`${settings.features?.mobileColumns === 1 ? 'columns-1 sm:columns-2' : 'columns-2'} lg:columns-3 xl:columns-4 gap-1 px-0`}>
          {results.map((post, i) => (
             <div key={post.id} className="mb-1 inline-block w-full break-inside-avoid">
              <PostCard post={post} index={i} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <SearchIcon className="w-16 h-16 text-surface-200 dark:text-surface-700 mx-auto mb-4" />
          <p className="text-xl font-semibold text-surface-400">No results found</p>
          <p className="text-sm text-surface-400 mt-2 mb-6">Try different keywords or browse collections</p>
          <Link href="/" className="px-5 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors">
            Browse Home
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading search results...</div>}>
      <SearchContent />
    </Suspense>
  );
}
