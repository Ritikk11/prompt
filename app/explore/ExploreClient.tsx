'use client';
import React, { useState, useRef, useEffect } from 'react';
import { getGridClasses } from '@/lib/utils';
import type { Post, SiteSettings } from '@/lib/types';
import AdSlot from '@/components/AdSlot';
import PostCard from '@/components/PostCard';
import FilterChipRail from '@/components/FilterChipRail';
import { getFilterTagsFromPosts } from '@/lib/filter-tags';
import { getAllTools } from '@/lib/constants';
import { Flame, Sparkles } from 'lucide-react';
import DiscoveryPageHero from '@/components/DiscoveryPageHero';
import { fillDiscoveryTemplate } from '@/lib/discovery-pages';

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

        {showCustomRail && (
          <FilterChipRail posts={filtered} tools={tools} tags={filterTags} items={filterItems} settings={settings} renderGrid />
        )}
      </div>

      {/* Masonry layout like Pinterest */}
      {!showCustomRail && (
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
