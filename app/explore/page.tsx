'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '@/components/context/DataContext';
import dynamic from 'next/dynamic';
import SkeletonPostCard from '@/components/SkeletonPostCard';
import { getGridClasses } from '@/lib/utils';

const PostCard = dynamic(() => import('@/components/PostCard'), {
  loading: () => <SkeletonPostCard />
});

const AdSlot = dynamic(() => import('@/components/AdSlot'), {
  ssr: false
});

export default function Explore() {
  const { posts, settings, loading } = useData();
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [filterTool, setFilterTool] = useState('all');

  const itemsPerLoad = settings.features?.infiniteScrollItems || 20;
  const [displayedCount, setDisplayedCount] = useState(itemsPerLoad);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const publicPosts = posts.filter(p => p.status === 'published' || !p.status);
  const tools = ['all', ...Array.from(new Set(publicPosts.flatMap(p => p.images.map(i => i.aiTool))))];

  let filtered = [...publicPosts];
  if (filterTool !== 'all') {
    filtered = filtered.filter(p => p.images.some(i => i.aiTool === filterTool));
  }
  if (sortBy === 'latest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy === 'popular') {
    filtered.sort((a, b) => b.views - a.views);
  } else if (sortBy === 'trending') {
    const viewsW = settings.features?.trendingViewsWeight ?? 1;
    const likesW = settings.features?.trendingLikesWeight ?? 2;
    filtered.sort((a, b) => (b.views * viewsW + b.likes * likesW) - (a.views * viewsW + a.likes * likesW));
  }

  useEffect(() => {
    if (!settings.features?.infiniteScroll) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setDisplayedCount(prev => prev + itemsPerLoad);
      }
    }, { rootMargin: '400px' });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, [settings.features?.infiniteScroll, filtered.length, itemsPerLoad]);

  const visiblePosts = filtered.slice(0, displayedCount);

  return (
    <div className="max-w-7xl mx-auto px-1 py-4 sm:py-6 fade-in">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Explore All Prompts</h1>
      <p className="text-surface-500 dark:text-surface-400 mb-6">Discover {posts.length} curated prompt collections</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">Sort:</span>
          <div className="flex rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${sortBy === 'latest' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700'}`}
            >
              Latest
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${sortBy === 'popular' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700'}`}
            >
              Popular
            </button>
            {settings.features?.trendingAlgorithm && (
              <button
                onClick={() => setSortBy('trending')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${sortBy === 'trending' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700'}`}
              >
                Trending
              </button>
            )}
          </div>
        </div>

        {/* AI Tool filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">Tool:</span>
          <select
            value={filterTool}
            onChange={e => setFilterTool(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none"
          >
            {tools.map(t => <option key={t} value={t}>{t === 'all' ? 'All Tools' : t}</option>)}
          </select>
        </div>
      </div>

      {/* Masonry layout like Pinterest */}
      {loading && settings.features?.skeletonLoaders ? (
         <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
           {Array.from({ length: 10 }).map((_, i) => (
             <div key={i} className="mb-1 inline-block w-full break-inside-avoid">
                <SkeletonPostCard />
             </div>
           ))}
         </div>
      ) : (
        <>
          <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
            {visiblePosts.map((post, i) => (
              <React.Fragment key={post.id}>
                <div className="mb-1 inline-block w-full break-inside-avoid">
                  <PostCard post={post} index={i} />
                </div>
                <AdSlot placement="inFeed" inFeedIndex={i} className="mb-1 inline-block w-full break-inside-avoid bg-surface-50 dark:bg-surface-800/30 rounded-[18px]" />
              </React.Fragment>
            ))}
          </div>
          
          {visiblePosts.length < filtered.length && (
            <div ref={loadMoreRef} className="py-8 text-center flex flex-col items-center justify-center">
              {settings.features?.infiniteScroll ? (
                <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              ) : (
                <button 
                  onClick={() => setDisplayedCount(prev => prev + itemsPerLoad)}
                  className="px-6 py-2.5 rounded-full font-bold bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 transition-colors"
                >
                  Load More Prompts
                </button>
              )}
            </div>
          )}
        </>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-xl font-semibold text-surface-400">No prompts found</p>
          <p className="text-sm text-surface-400 mt-2">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
