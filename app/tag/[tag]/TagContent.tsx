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
    <div className="max-w-7xl mx-auto px-1 py-6 sm:py-8 fade-in">
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
            className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[13px] font-medium transition-colors duration-150 ${sortBy === 'latest' ? 'bg-primary-600 text-white dark:bg-primary-500' : 'border border-surface-200 text-surface-600 hover:border-surface-300 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-400 dark:hover:border-surface-600 dark:hover:bg-surface-800'}`}
          >
            Latest
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[13px] font-medium transition-colors duration-150 ${sortBy === 'popular' ? 'bg-primary-600 text-white dark:bg-primary-500' : 'border border-surface-200 text-surface-600 hover:border-surface-300 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-400 dark:hover:border-surface-600 dark:hover:bg-surface-800'}`}
          >
            Popular
          </button>
          {showTrending && (
            <button
              onClick={() => setSortBy('trending')}
              className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[13px] font-medium transition-colors duration-150 ${sortBy === 'trending' ? 'bg-primary-600 text-white dark:bg-primary-500' : 'border border-surface-200 text-surface-600 hover:border-surface-300 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-400 dark:hover:border-surface-600 dark:hover:bg-surface-800'}`}
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
                className={`inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-xl px-3 text-[13px] font-medium transition-colors duration-150 ${filterTool === t ? 'bg-primary-600 text-white dark:bg-primary-500' : 'border border-surface-200 text-surface-600 hover:border-surface-300 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-400 dark:hover:border-surface-600 dark:hover:bg-surface-800'}`}
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
      ) : <ScrollReveal>
      <div data-reveal-stagger className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
        {filtered.map((post, i) => (
          <React.Fragment key={post.id}>
            <div className="mb-1 inline-block w-full break-inside-avoid">
              <PostCard post={post} index={i} />
            </div>
            <AdSlot placement="inFeed" inFeedIndex={i} className="mb-1 inline-block w-full break-inside-avoid bg-surface-50 dark:bg-surface-800/30 rounded-[18px]" />
          </React.Fragment>
        ))}
      </div>
      </ScrollReveal>}

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-xl font-semibold text-surface-400">No prompts found</p>
          <p className="text-sm text-surface-400 mt-2">There are no collections with the tag &quot;{tag}&quot; yet.</p>
        </div>
      )}
    </div>
  );
}
