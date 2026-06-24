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

  // Filter public posts that include the tag (case insensitive)
  const publicPosts = posts.filter(p => (p.status === 'published' || !p.status) && p.visibility !== 'private');
  let filtered = publicPosts.filter(p => 
    p.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );

  const tools = ['all', ...Array.from(new Set(filtered.flatMap(p => p.images.map(i => i.aiTool))))];
  const heroTitle = fillDiscoveryTemplate(discovery.tagTitleTemplate || '%tag% Prompts', { tag, count: filtered.length });
  const heroDescription = fillDiscoveryTemplate(discovery.tagDescriptionTemplate || 'Showing %count% collections tagged with "%tag%".', { tag, count: filtered.length });

  if (!useCustomRail && showAdvancedFilters && filterTool !== 'all') {
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
      {!useCustomRail && <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
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
            {showTrending && (
              <button
                onClick={() => setSortBy('trending')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${sortBy === 'trending' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700'}`}
              >
                Trending
              </button>
            )}
          </div>
        </div>

        {showAdvancedFilters && (
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
        )}
      </div>}

      {/* Grid */}
      {useCustomRail ? (
        <FilterChipRail
          posts={filtered}
          items={railItems}
          tools={[]}
          tags={[]}
          settings={settings}
          renderGrid
        />
      ) : <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
        {filtered.map((post, i) => (
          <React.Fragment key={post.id}>
            <div className="mb-1 inline-block w-full break-inside-avoid">
              <PostCard post={post} index={i} />
            </div>
            <AdSlot placement="inFeed" inFeedIndex={i} className="mb-1 inline-block w-full break-inside-avoid bg-surface-50 dark:bg-surface-800/30 rounded-[18px]" />
          </React.Fragment>
        ))}
      </div>}

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-xl font-semibold text-surface-400">No prompts found</p>
          <p className="text-sm text-surface-400 mt-2">There are no collections with the tag &quot;{tag}&quot; yet.</p>
        </div>
      )}
    </div>
  );
}
