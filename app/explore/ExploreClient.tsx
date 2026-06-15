'use client';
import React, { useState, useRef, useEffect } from 'react';
import { getGridClasses } from '@/lib/utils';
import type { Post, SiteSettings } from '@/lib/types';
import AdSlot from '@/components/AdSlot';
import PostCard from '@/components/PostCard';
import FilterChipRail from '@/components/FilterChipRail';
import { getFilterTagsFromPosts } from '@/lib/filter-tags';
import { getAllTools } from '@/lib/constants';
import { Compass, Flame, Sparkles } from 'lucide-react';

export default function ExploreClient({ posts, settings }: { posts: Post[], settings: SiteSettings }) {
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');

  const itemsPerLoad = settings.features?.infiniteScrollItems || 20;
  const [displayedCount, setDisplayedCount] = useState(itemsPerLoad);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const publicPosts = posts.filter(p => (p.status === 'published' || !p.status) && p.visibility !== 'private');
  const tools = Array.from(new Set(publicPosts.flatMap(p => getAllTools(p))));
  const filterTags = settings.exploreFilterTags?.length ? settings.exploreFilterTags : getFilterTagsFromPosts(publicPosts);
  const filterItems = settings.exploreFilterItems || [];
  const showAdvancedFilters = settings.features?.advancedFiltering;
  const showTrending = settings.features?.trendingAlgorithm;

  let filtered = [...publicPosts];
  if (sortBy === 'latest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy === 'popular') {
    filtered.sort((a, b) => b.views - a.views);
  } else if (showTrending && sortBy === 'trending') {
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
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 fade-in">
      <section className="relative mb-8 overflow-hidden rounded-[30px] border border-surface-200 bg-white px-5 py-10 shadow-[0_22px_70px_rgba(15,23,42,0.08)] dark:border-surface-800 dark:bg-surface-950 sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(124,58,237,0.12),transparent_30%),radial-gradient(circle_at_82%_0%,rgba(14,165,233,0.10),transparent_28%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-4 py-2 text-xs font-black text-primary-600 dark:text-primary-300">
              <Compass className="h-4 w-4" />
              Prompt Library
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-normal text-surface-950 dark:text-white sm:text-5xl">
              Explore curated AI image prompts
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-surface-600 dark:text-surface-300">
              Browse {publicPosts.length} prompt collections by model, visual direction, and creative use case.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <div className="rounded-2xl border border-surface-200 bg-surface-50 px-5 py-4 dark:border-surface-800 dark:bg-surface-900/70">
              <p className="text-2xl font-black text-surface-950 dark:text-white">{publicPosts.length}</p>
              <p className="mt-1 text-xs font-bold text-surface-500 dark:text-surface-400">Prompts</p>
            </div>
            <div className="rounded-2xl border border-surface-200 bg-surface-50 px-5 py-4 dark:border-surface-800 dark:bg-surface-900/70">
              <p className="text-2xl font-black text-surface-950 dark:text-white">{tools.length}</p>
              <p className="mt-1 text-xs font-bold text-surface-500 dark:text-surface-400">AI tools</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="mb-7 space-y-4">
        {/* Sort */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <div className="flex shrink-0 rounded-2xl border border-surface-200 bg-surface-50 p-1 dark:border-surface-800 dark:bg-surface-900">
            <button
              onClick={() => setSortBy('latest')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${sortBy === 'latest' ? 'bg-primary-500 text-white shadow-sm' : 'text-surface-600 hover:bg-white dark:text-surface-300 dark:hover:bg-surface-800'}`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Latest
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${sortBy === 'popular' ? 'bg-primary-500 text-white shadow-sm' : 'text-surface-600 hover:bg-white dark:text-surface-300 dark:hover:bg-surface-800'}`}
            >
              <Flame className="h-3.5 w-3.5" />
              Popular
            </button>
            {showTrending && (
              <button
                onClick={() => setSortBy('trending')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${sortBy === 'trending' ? 'bg-primary-500 text-white shadow-sm' : 'text-surface-600 hover:bg-white dark:text-surface-300 dark:hover:bg-surface-800'}`}
              >
                <Flame className="h-3.5 w-3.5" />
                Trending
              </button>
            )}
          </div>
        </div>

        {showAdvancedFilters && (
          <FilterChipRail posts={filtered} tools={tools} tags={filterTags} items={filterItems} settings={settings} renderGrid />
        )}
      </div>

      {/* Masonry layout like Pinterest */}
      {!showAdvancedFilters && (
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

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-xl font-semibold text-surface-400">No prompts found</p>
              <p className="text-sm text-surface-400 mt-2">Try adjusting your filters</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
