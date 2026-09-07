'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getGridClasses } from '@/lib/utils';
import type { Post, Section, SiteSettings } from '@/lib/types';
import AdSlot from '@/components/AdSlot';
import PostCard from '@/components/PostCard';
import FilterChipRail from '@/components/FilterChipRail';
import MasonryGrid from '@/components/MasonryGrid';
import DiscoveryPageHero from '@/components/DiscoveryPageHero';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ScrollReveal from '@/components/ScrollReveal';

interface Props {
  section: Section;
  posts: Post[];
  heroTitle: string;
  heroDescription: string;
  settings: SiteSettings;
}

export default function SectionContent({ section, posts, heroTitle, heroDescription, settings }: Props) {
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [filterTool, setFilterTool] = useState('all');
  const showAdvancedFilters = settings.features?.advancedFiltering;
  const showTrending = settings.features?.trendingAlgorithm;

  // Per-section rail: the toggle + chips saved on the section object itself.
  const useCustomRail = Boolean(section.useCustomRail);
  const railItems = section.railItems || [];
  const showCustomRail = useCustomRail && railItems.length > 0;
  // A section can also carry a lightweight tag rail (filterTags) without the
  // full custom-rail builder. That still counts as a rail, so the sort/filter
  // toolbar stays hidden for it — matching the "rail off = sort UI" contract.
  const showTagRail = !showCustomRail && Boolean(section.filterTags?.length);
  const showRail = showCustomRail || showTagRail;
  // The rail owns sort when it is shown (the standalone toolbar is hidden then).
  const sortOptions = [
    { label: 'Latest', value: 'latest' },
    { label: 'Popular', value: 'popular' },
    ...(showTrending ? [{ label: 'Trending', value: 'trending' }] : []),
  ];
  const railSortProps = {
    sortValue: sortBy,
    sortOptions,
    onSortChange: (value: string) => setSortBy(value as typeof sortBy),
  };

  let filtered = [...posts];
  const tools = ['all', ...Array.from(new Set(filtered.flatMap(p => p.images.map(i => i.aiTool))))];

  if (!showRail && showAdvancedFilters && filterTool !== 'all') {
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
    <div className="max-w-7xl mx-auto px-2 py-8 sm:py-12">
      <nav className="flex items-center gap-2 text-sm text-surface-400 mb-8 font-medium">
        <Link href="/" className="hover:text-primary-500 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <span className="text-surface-900 dark:text-white">{section.name}</span>
      </nav>

      <DiscoveryPageHero
        badge={section.heroBadge || 'Section'}
        title={heroTitle}
        description={heroDescription}
        stats={(settings.discoveryPages?.showHeroStats ?? true) ? [{ label: 'Prompts', value: filtered.length }] : []}
      />
      {section.introContent && (
        <div className="max-w-3xl mb-12">
          <MarkdownRenderer>{section.introContent}</MarkdownRenderer>
        </div>
      )}

      {/* Sort/filter toolbar — only when no rail is active. */}
      {!showRail && filtered.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 flex-wrap">
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
                Trending
              </button>
            )}
          </div>

          {showAdvancedFilters && tools.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-surface-400 select-none">Tool:</span>
              {tools.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterTool(t)}
                  className={`inline-flex h-8 shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium outline-none transition-[background-color,border-color,color,transform,opacity] duration-150 ease-out transform-gpu active:scale-[0.98] active:opacity-85 ${
                    filterTool === t
                      ? 'border-primary-600 bg-primary-600 text-white dark:border-primary-500 dark:bg-primary-500 shadow-sm'
                      : 'border-white/80 bg-white/60 text-surface-700 backdrop-blur-xl backdrop-saturate-150 hover:border-white/90 hover:bg-white/80 hover:text-surface-900 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-300 dark:hover:border-white/20 dark:hover:bg-white/[0.12] dark:hover:text-white'
                  }`}
                >
                  {t === 'all' ? 'All Tools' : t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-white/70 bg-white/40 py-20 text-center backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.05]">
          <p className="text-surface-500 font-medium">No prompts found in this section yet.</p>
          <Link href="/explore" className="mt-4 inline-block text-primary-500 font-bold hover:underline">
            Explore other prompts
          </Link>
        </div>
      ) : showCustomRail ? (
        <ScrollReveal>
          <FilterChipRail
            posts={filtered}
            items={railItems}
            tools={[]}
            tags={[]}
            settings={settings}
            cardStyleOverride={section.cardStyle}
            {...railSortProps}
            renderGrid
            sticky
          />
        </ScrollReveal>
      ) : showTagRail ? (
        <ScrollReveal>
          <FilterChipRail
            posts={filtered}
            tools={[]}
            tags={section.filterTags || []}
            showTools={false}
            settings={settings}
            cardStyleOverride={section.cardStyle}
            {...railSortProps}
            renderGrid
            sticky
          />
        </ScrollReveal>
      ) : (
        <ScrollReveal>
          <MasonryGrid
            posts={filtered}
            settings={settings}
            cardStyleOverride={section.cardStyle}
          />
        </ScrollReveal>
      )}
    </div>
  );
}
