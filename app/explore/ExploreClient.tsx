'use client';
import React, { useState, useRef, useEffect } from 'react';
import { getGridClasses } from '@/lib/utils';
import type { Post, SiteSettings } from '@/lib/types';
import AdSlot from '@/components/AdSlot';
import PostCard from '@/components/PostCard';
import MasonryGrid from '@/components/MasonryGrid';
import FilterChipRail from '@/components/FilterChipRail';
import { getFilterTagsFromPosts } from '@/lib/filter-tags';
import { getAllTools } from '@/lib/constants';
import { Clock, Flame, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import DiscoveryPageHero from '@/components/DiscoveryPageHero';
import { fillDiscoveryTemplate } from '@/lib/discovery-pages';
import ScrollReveal from '@/components/ScrollReveal';

export default function ExploreClient({
  posts,
  settings,
  initialCategory,
}: {
  posts: Post[];
  settings: SiteSettings;
  initialCategory?: string;
}) {
  const searchParams = useSearchParams();
  const urlCategory = searchParams ? searchParams.get('category') : null;
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory || (urlCategory ? decodeURIComponent(urlCategory) : null));

  useEffect(() => {
    if (urlCategory) {
      setActiveCategory(decodeURIComponent(urlCategory));
    }
  }, [urlCategory]);

  const itemsPerLoad = settings.features?.infiniteScrollItems || 20;
  const [displayedCount, setDisplayedCount] = useState(itemsPerLoad);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const publicPosts = posts.filter(p => (p.status === 'published' || !p.status) && p.visibility !== 'private');
  const tools = Array.from(new Set(publicPosts.flatMap(p => getAllTools(p))));
  const filterTags = settings.exploreFilterTags?.length ? settings.exploreFilterTags : getFilterTagsFromPosts(publicPosts);
  const discovery = settings.discoveryPages || {};
  const showTrending = settings.features?.trendingAlgorithm;
  const useCustomRail = Boolean(discovery.useCustomRailOnExplore);
  const filterItems = discovery.exploreRailItems?.length ? discovery.exploreRailItems : (settings.exploreFilterItems || []);
  const showCustomRail = useCustomRail && filterItems.length > 0;
  // When the rail is active it owns the sort control (as a dropdown at its head)
  // so the pinned rail carries every filter affordance; otherwise the standalone
  // segmented toolbar below is used.
  const sortOptions = [
    { label: 'Latest', value: 'latest' },
    { label: 'Popular', value: 'popular' },
    ...(showTrending ? [{ label: 'Trending', value: 'trending' }] : []),
  ];

  let filtered = [...publicPosts];
  if (activeCategory) {
    const target = activeCategory.toLowerCase();
    filtered = filtered.filter(p =>
      (p.category && p.category.toLowerCase() === target) ||
      (p.categories && p.categories.some(c => c.toLowerCase() === target))
    );
  }

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
    <div className="max-w-7xl mx-auto px-2 py-6 sm:py-8 fade-in">
      <DiscoveryPageHero
        badge={discovery.exploreBadge || 'Prompt Library'}
        title={discovery.exploreTitle || 'Explore curated AI image prompts'}
        description={fillDiscoveryTemplate(discovery.exploreDescription || 'Browse %count% prompt collections by model, visual direction, and creative use case.', {
          count: publicPosts.length,
          tools: tools.length,
        })}
        stats={(discovery.showHeroStats ?? true) ? [
          { label: 'Prompts', value: publicPosts.length },
          { label: 'AI tools', value: tools.length },
        ] : []}
        variant={discovery.heroStyle || 'container'}
      />

      {/* Active Category Filter Pill */}
      {activeCategory && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-surface-400 select-none">Category:</span>
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className="inline-flex h-8 shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full border border-primary-600 bg-primary-600 px-3.5 text-[13px] font-medium text-white shadow-sm outline-none transition-[background-color,border-color,color,transform,opacity] duration-150 ease-out transform-gpu hover:opacity-90 active:scale-[0.98] dark:border-primary-500 dark:bg-primary-500"
            title="Clear category filter"
          >
            <span className="capitalize">{activeCategory}</span>
            <X className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-7 space-y-4">
        {/* Sort — standalone only when the rail isn't rendering its own control */}
        {!showCustomRail && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-surface-400 select-none">Sort:</span>
            <button
              type="button"
              onClick={() => setSortBy('latest')}
              className={`inline-flex h-8 shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium outline-none transition-[background-color,border-color,color,transform,opacity] duration-150 ease-out transform-gpu active:scale-[0.98] active:opacity-85 ${
                sortBy === 'latest'
                  ? 'border-primary-600 bg-primary-600 text-white dark:border-primary-500 dark:bg-primary-500 shadow-sm'
                  : 'border-white/80 bg-white/60 text-surface-700 backdrop-blur-xl backdrop-saturate-150 hover:border-white/90 hover:bg-white/80 hover:text-surface-900 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-300 dark:hover:border-white/20 dark:hover:bg-white/[0.12] dark:hover:text-white'
              }`}
            >
              <Clock className="h-3.5 w-3.5 opacity-70" />
              Latest
            </button>
            <button
              type="button"
              onClick={() => setSortBy('popular')}
              className={`inline-flex h-8 shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium outline-none transition-[background-color,border-color,color,transform,opacity] duration-150 ease-out transform-gpu active:scale-[0.98] active:opacity-85 ${
                sortBy === 'popular'
                  ? 'border-primary-600 bg-primary-600 text-white dark:border-primary-500 dark:bg-primary-500 shadow-sm'
                  : 'border-white/80 bg-white/60 text-surface-700 backdrop-blur-xl backdrop-saturate-150 hover:border-white/90 hover:bg-white/80 hover:text-surface-900 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-300 dark:hover:border-white/20 dark:hover:bg-white/[0.12] dark:hover:text-white'
              }`}
            >
              <Flame className="h-3.5 w-3.5 opacity-70" />
              Popular
            </button>
            {showTrending && (
              <button
                type="button"
                onClick={() => setSortBy('trending')}
                className={`inline-flex h-8 shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium outline-none transition-[background-color,border-color,color,transform,opacity] duration-150 ease-out transform-gpu active:scale-[0.98] active:opacity-85 ${
                  sortBy === 'trending'
                    ? 'border-primary-600 bg-primary-600 text-white dark:border-primary-500 dark:bg-primary-500 shadow-sm'
                    : 'border-white/80 bg-white/60 text-surface-700 backdrop-blur-xl backdrop-saturate-150 hover:border-white/90 hover:bg-white/80 hover:text-surface-900 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-300 dark:hover:border-white/20 dark:hover:bg-white/[0.12] dark:hover:text-white'
                }`}
              >
                <Flame className="h-3.5 w-3.5 opacity-70" />
                Trending
              </button>
            )}
          </div>
        )}

        {showCustomRail && (
          <ScrollReveal>
            <FilterChipRail
              posts={filtered}
              tools={tools}
              tags={filterTags}
              items={filterItems}
              settings={settings}
              sortValue={sortBy}
              sortOptions={sortOptions}
              onSortChange={value => setSortBy(value as typeof sortBy)}
              renderGrid
              sticky
            />
          </ScrollReveal>
        )}
      </div>

      {/* Masonry layout like Pinterest */}
      {!showCustomRail && (
        <>
          <ScrollReveal>
            <MasonryGrid
              posts={visiblePosts}
              settings={settings}
            />
          </ScrollReveal>
          
          {visiblePosts.length < filtered.length && (
            <div ref={loadMoreRef} className="py-8 text-center flex flex-col items-center justify-center">
              {settings.features?.infiniteScroll ? (
                <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              ) : (
                <button 
                  onClick={() => setDisplayedCount(prev => prev + itemsPerLoad)}
                  className="rounded-full border border-white/80 bg-white/60 px-6 py-2.5 font-bold text-surface-800 shadow-sm backdrop-blur-xl transition hover:scale-105 hover:border-primary-400/60 hover:text-primary-600 active:scale-95 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-200 dark:hover:text-white"
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
