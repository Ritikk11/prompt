'use client';
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getGridClasses } from '@/lib/utils';
import type { Post, SiteSettings } from '@/lib/types';
import AdSlot from '@/components/AdSlot';

import PostCard from '@/components/PostCard';
import FilterChipRail from '@/components/FilterChipRail';
import DiscoveryPageHero from '@/components/DiscoveryPageHero';
import MasonryGrid from '@/components/MasonryGrid';
import { fillDiscoveryTemplate } from '@/lib/discovery-pages';
import ScrollReveal from '@/components/ScrollReveal';

export default function TagContent({ posts, settings }: { posts: Post[], settings: SiteSettings }) {
  const params = useParams();
  const rawTag = params.tag as string;
  const tag = decodeURIComponent(rawTag || '');
  
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [filterTool, setFilterTool] = useState('all');
  const showAdvancedFilters = settings.features?.advancedFiltering;
  const showTrending = settings.features?.trendingAlgorithm;
  const discovery = settings.discoveryPages || {};
  const useCustomRail = Boolean(discovery.useCustomRailOnTags);
  const railItems = discovery.tagRailItems || [];
  const showCustomRail = useCustomRail && railItems.length > 0;
  // The rail owns sort when it is shown (the standalone toolbar is hidden then).
  const sortOptions = [
    { label: 'Latest', value: 'latest' },
    { label: 'Popular', value: 'popular' },
    ...(showTrending ? [{ label: 'Trending', value: 'trending' }] : []),
  ];

  // Filter public posts that include the tag (case insensitive)
  const publicPosts = posts.filter(p => (p.status === 'published' || !p.status) && p.visibility !== 'private');
  let filtered = publicPosts.filter(p => 
    p.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );

  const tools = ['all', ...Array.from(new Set(filtered.flatMap(p => p.images.map(i => i.aiTool))))];
  const heroTitle = fillDiscoveryTemplate(discovery.tagTitleTemplate || '%tag% Prompts', { tag, count: filtered.length });
  const heroDescription = fillDiscoveryTemplate(discovery.tagDescriptionTemplate || 'Showing %count% collections tagged with "%tag%".', { tag, count: filtered.length });

  if (!showCustomRail && showAdvancedFilters && filterTool !== 'all') {
    filtered = filtered.filter(p => p.aiTools?.includes(filterTool) || p.images.some(i => i.aiTools ? i.aiTools.includes(filterTool) : i.aiTool === filterTool));
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

  return (
    <div className="max-w-7xl mx-auto px-2 py-6 sm:py-8 fade-in">
      {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-surface-500 mb-6">
          <Link href="/" className="hover:text-primary-500 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-surface-500 dark:text-surface-400">Tags</span>
          <span>/</span>
          <span className="text-surface-900 dark:text-surface-100 font-medium capitalize">Tag: {tag}</span>
        </div>

      <DiscoveryPageHero
        badge="Tag"
        title={heroTitle}
        description={heroDescription}
        stats={(discovery.showHeroStats ?? true) ? [{ label: 'Prompts', value: filtered.length }] : []}
      />

      {/* Filters */}
      {!showCustomRail && <div className="mb-8 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-xs font-medium uppercase tracking-wide text-surface-400">Sort:</span>
          <button
            onClick={() => setSortBy('latest')}
            className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-medium transition-colors duration-150 ${sortBy === 'latest' ? 'border border-primary-500/40 bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-300' : 'border border-white/80 bg-white/60 text-surface-700 shadow-sm backdrop-blur-xl hover:border-primary-400/60 hover:bg-white/80 hover:text-primary-600 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-300 dark:hover:border-primary-400/50 dark:hover:text-white'}`}
          >
            Latest
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-medium transition-colors duration-150 ${sortBy === 'popular' ? 'border border-primary-500/40 bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-300' : 'border border-white/80 bg-white/60 text-surface-700 shadow-sm backdrop-blur-xl hover:border-primary-400/60 hover:bg-white/80 hover:text-primary-600 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-300 dark:hover:border-primary-400/50 dark:hover:text-white'}`}
          >
            Popular
          </button>
          {showTrending && (
            <button
              onClick={() => setSortBy('trending')}
              className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-medium transition-colors duration-150 ${sortBy === 'trending' ? 'border border-primary-500/40 bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-300' : 'border border-white/80 bg-white/60 text-surface-700 shadow-sm backdrop-blur-xl hover:border-primary-400/60 hover:bg-white/80 hover:text-primary-600 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-300 dark:hover:border-primary-400/50 dark:hover:text-white'}`}
            >
              Trending
            </button>
          )}
        </div>

        {showAdvancedFilters && (
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-xs font-medium uppercase tracking-wide text-surface-400">Tool:</span>
            {tools.map(t => (
              <button
                key={t}
                onClick={() => setFilterTool(t)}
                className={`inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-[13px] font-medium transition-colors duration-150 ${filterTool === t ? 'border border-primary-500/40 bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-300' : 'border border-white/80 bg-white/60 text-surface-700 shadow-sm backdrop-blur-xl hover:border-primary-400/60 hover:bg-white/80 hover:text-primary-600 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-300 dark:hover:border-primary-400/50 dark:hover:text-white'}`}
              >
                {t === 'all' ? 'All Tools' : t}
              </button>
            ))}
          </div>
        )}
      </div>}

      {/* Grid */}
      {showCustomRail ? (
        <ScrollReveal>
          <FilterChipRail
            posts={filtered}
            items={railItems}
            tools={[]}
            tags={[]}
            settings={settings}
            sortValue={sortBy}
            sortOptions={sortOptions}
            onSortChange={value => setSortBy(value as typeof sortBy)}
            renderGrid
            sticky
          />
        </ScrollReveal>
      ) : (
        <ScrollReveal>
          <MasonryGrid
            posts={filtered}
            settings={settings}
          />
        </ScrollReveal>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-xl font-semibold text-surface-400">No prompts found</p>
          <p className="text-sm text-surface-400 mt-2">There are no collections with the tag &quot;{tag}&quot; yet.</p>
        </div>
      )}
    </div>
  );
}
