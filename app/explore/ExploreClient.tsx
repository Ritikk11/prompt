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
import { Clock, Flame } from 'lucide-react';
import DiscoveryPageHero from '@/components/DiscoveryPageHero';
import { fillDiscoveryTemplate } from '@/lib/discovery-pages';
import ScrollReveal from '@/components/ScrollReveal';

export default function ExploreClient({ posts, settings }: { posts: Post[], settings: SiteSettings }) {
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');

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
      />

      {/* Filters */}
      <div className="mb-7 space-y-4">
        {/* Sort — standalone only when the rail isn't rendering its own control */}
        {!showCustomRail && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSortBy('latest')}
              className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[13px] font-medium transition-colors duration-150 ${sortBy === 'latest' ? 'bg-primary-600 text-white dark:bg-primary-500' : 'border border-surface-200 text-surface-600 hover:border-surface-300 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-400 dark:hover:border-surface-600 dark:hover:bg-surface-800'}`}
            >
              <Clock className="h-3.5 w-3.5" />
              Latest
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[13px] font-medium transition-colors duration-150 ${sortBy === 'popular' ? 'bg-primary-600 text-white dark:bg-primary-500' : 'border border-surface-200 text-surface-600 hover:border-surface-300 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-400 dark:hover:border-surface-600 dark:hover:bg-surface-800'}`}
            >
              <Flame className="h-3.5 w-3.5" />
              Popular
            </button>
            {showTrending && (
              <button
                onClick={() => setSortBy('trending')}
                className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[13px] font-medium transition-colors duration-150 ${sortBy === 'trending' ? 'bg-primary-600 text-white dark:bg-primary-500' : 'border border-surface-200 text-surface-600 hover:border-surface-300 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-400 dark:hover:border-surface-600 dark:hover:bg-surface-800'}`}
              >
                <Flame className="h-3.5 w-3.5" />
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
